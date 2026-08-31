import CustomRequest from "../models/customRequestModel.js";
import Customer from "../models/customerModel.js";
import Supplier from "../models/supplierModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { deleteImages } from "../services/cloudinary.service.js";
import { uploadToCloudinary } from "../middleware/upload.middleware.js";
import { buildCustomRequestWhatsAppLink } from "../services/whatsapp.service.js";
import { createNotification } from "../services/notification.service.js";

/* ── Helper: Normalize measurements object/map safely ───────────── */
function normalizeMeasurements(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? normalizeMeasurements(parsed) : {};
    } catch {
      return {};
    }
  }
  if (raw instanceof Map) {
    return Object.fromEntries(raw);
  }
  if (typeof raw === "object") {
    if (typeof raw.toJSON === "function") {
      return normalizeMeasurements(raw.toJSON());
    }
    const clean = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!k.startsWith("$") && !k.startsWith("_") && typeof v !== "object" && typeof v !== "function") {
        clean[k] = String(v);
      }
    }
    return clean;
  }
  return {};
}

/* ── Helper: Sync bespoke materials to chosen suppliers ────────── */
async function syncSupplierMaterials(customRequest) {

  if (!customRequest.materials || !Array.isArray(customRequest.materials)) return;

  const vendorId = customRequest.vendor;

  for (let idx = 0; idx < customRequest.materials.length; idx++) {
    const mat = customRequest.materials[idx];
    if (mat.supplier) {
      const supplierId = typeof mat.supplier === "object" ? mat.supplier._id : mat.supplier;
      if (supplierId) {
        const supplier = await Supplier.findOne({ _id: supplierId, vendor: vendorId });
        if (supplier) {
          let purchase = supplier.purchases.find(
            (p) =>
              p.customRequest &&
              p.customRequest.toString() === customRequest._id.toString() &&
              p.materialIndex === idx
          );

          const cost = Number(mat.estimatedCost) || 0;
          const isAcquired = Boolean(mat.acquired);
          const desc = `Bespoke: ${customRequest.title} (${mat.name}${mat.quantity ? " - " + mat.quantity : ""})`;

          if (purchase) {
            purchase.description = desc;
            purchase.amount = cost;
            purchase.paidAmount = isAcquired ? cost : 0;
            purchase.status = isAcquired ? "delivered" : "ordered";
          } else {
            supplier.purchases.push({
              description: desc,
              amount: cost,
              paidAmount: isAcquired ? cost : 0,
              status: isAcquired ? "delivered" : "ordered",
              date: customRequest.createdAt || new Date(),
              customRequest: customRequest._id,
              materialIndex: idx,
            });
          }

          await supplier.save();
        }
      }
    }
  }
}

/* ── GET /api/custom-requests ───────────────────────────────────── */
export const getCustomRequests = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    page = 1,
    limit = 20,
    status,
    search,
    category,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const filter = { vendor: vendorId };

  if (status && status !== "all") filter.status = status;
  if (category) filter.category = category;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { "customerSnapshot.name": { $regex: search, $options: "i" } },
      { "customerSnapshot.phone": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = order === "asc" ? 1 : -1;

  const [requestsRaw, total] = await Promise.all([
    CustomRequest.find(filter)
      .populate("materials.supplier", "name phone category")
      .sort({ [sort]: sortDir })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomRequest.countDocuments(filter),
  ]);

  const requests = requestsRaw.map((reqObj) => {
    return {
      ...reqObj,
      whatsappLinks: {
        quote: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "quote"),
        confirmed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "confirmed"),
        fitting: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "fitting"),
        completed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "completed"),
      },
    };
  });

  const totalPages = Math.ceil(total / Number(limit));

  return sendSuccess(res, {
    requests,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
    },
  });
});

/* ── GET /api/custom-requests/summary ───────────────────────────── */
export const getCustomRequestSummary = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const now = new Date();

  const [activeRequests, overdueRequests, debtAggregation, totalValueAgg] = await Promise.all([
    CustomRequest.countDocuments({
      vendor: vendorId,
      status: { $nin: ["completed", "cancelled"] },
    }),
    CustomRequest.countDocuments({
      vendor: vendorId,
      status: { $nin: ["completed", "cancelled"] },
      deadline: { $lt: now, $ne: null },
    }),
    CustomRequest.aggregate([
      {
        $match: {
          vendor: vendorId,
          status: { $ne: "cancelled" },
          balanceOwed: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balanceOwed" },
        },
      },
    ]),
    CustomRequest.aggregate([
      {
        $match: {
          vendor: vendorId,
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalAgreed: {
            $sum: {
              $cond: [
                { $gt: ["$agreedPrice", 0] },
                "$agreedPrice",
                { $ifNull: ["$estimatedPrice", 0] },
              ],
            },
          },
        },
      },
    ]),
  ]);

  const totalBalance = debtAggregation[0]?.totalBalance ?? 0;
  const totalAgreed = totalValueAgg[0]?.totalAgreed ?? 0;

  return sendSuccess(res, {
    activeCount: activeRequests,
    overdueCount: overdueRequests,
    totalBalanceOwed: totalBalance,
    totalAgreedValue: totalAgreed,
  });
});


/* ── GET /api/custom-requests/:id ───────────────────────────────── */
export const getCustomRequest = asyncHandler(async (req, res) => {
  const requestDoc = await CustomRequest.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  })
    .populate("customer", "name phone email instagram measurements notes tags")
    .populate("materials.supplier", "name phone category contactName");

  if (!requestDoc) {
    return sendError(res, "Custom request not found", 404);
  }

  const reqObj = requestDoc.toObject({ flattenMaps: true });
  reqObj.whatsappLinks = {
    quote: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "quote"),
    confirmed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "confirmed"),
    fitting: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "fitting"),
    completed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "completed"),
  };

  return sendSuccess(res, reqObj);
});

/* ── POST /api/custom-requests ──────────────────────────────────── */
export const createCustomRequest = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const {
    title,
    description = "",
    category = "clothing",
    customerName,
    customerPhone,
    customerEmail = "",
    measurements,
    materials,
    estimatedPrice = 0,
    agreedPrice = 0,
    depositPaid = 0,
    deadline,
    source = "dm",
    notes = "",
  } = req.body;

  const parsedMeasurements = normalizeMeasurements(measurements);

  let parsedMaterials = materials;
  if (typeof materials === "string") {
    try {
      parsedMaterials = JSON.parse(materials);
    } catch {
      parsedMaterials = [];
    }
  }

  // Auto-find or create customer
  let customer = null;
  if (req.body.customerId) {
    customer = await Customer.findOne({ _id: req.body.customerId, vendor: vendorId });
  }
  if (!customer && customerPhone) {
    customer = await Customer.findOne({ vendor: vendorId, phone: customerPhone });
  }

  if (!customer) {
    customer = await Customer.create({
      vendor: vendorId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      measurements: parsedMeasurements,
    });
  } else {
    if (customerName) customer.name = customerName;
    if (customerEmail) customer.email = customerEmail;
    if (Object.keys(parsedMeasurements).length > 0) {
      if (!customer.measurements) customer.measurements = new Map();
      for (const [k, v] of Object.entries(parsedMeasurements)) {
        if (typeof customer.measurements.set === "function") {
          customer.measurements.set(k, String(v));
        } else {
          customer.measurements[k] = String(v);
        }
      }
    }
    await customer.save();
  }

  // Upload reference images if any
  const referenceImages = await Promise.all(
    (req.files || []).map(async (file) => {
      const result = await uploadToCloudinary(file.buffer);
      return { url: result.secure_url, publicId: result.public_id };
    })
  );

  // If no measurements provided in form, inherit clean measurements from customer's profile
  let finalMeasurements = parsedMeasurements;
  if (Object.keys(finalMeasurements).length === 0 && customer.measurements) {
    finalMeasurements = normalizeMeasurements(customer.measurements);
  }

  const customRequest = await CustomRequest.create({
    vendor: vendorId,
    customer: customer._id,
    customerSnapshot: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    },
    title,
    description,
    category,
    referenceImages,
    measurements: finalMeasurements,
    materials: parsedMaterials || [],
    estimatedPrice: Number(estimatedPrice) || 0,
    agreedPrice: Number(agreedPrice) || 0,
    depositPaid: Number(depositPaid) || 0,
    deadline: deadline ? new Date(deadline) : null,
    source,
    notes,
    status: Number(depositPaid) > 0 ? "confirmed" : "inquiry",
  });


  const reqObj = customRequest.toObject({ flattenMaps: true });
  reqObj.whatsappLinks = {
    quote: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "quote"),
    confirmed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "confirmed"),
    fitting: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "fitting"),
    completed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "completed"),
  };

  await createNotification(vendorId, {
    title: "New Bespoke Request",
    message: `New request "${title}" recorded for ${customerName}.`,
    type: "order_status",
    actionUrl: `/dashboard/demands/${customRequest._id}`,
  });

  // Sync material requirements to suppliers if chosen
  await syncSupplierMaterials(customRequest);

  return sendSuccess(res, reqObj, "Custom request created successfully", 201);
});

/* ── PUT /api/custom-requests/:id ───────────────────────────────── */
export const updateCustomRequest = asyncHandler(async (req, res) => {
  const customRequest = await CustomRequest.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!customRequest) {
    return sendError(res, "Custom request not found", 404);
  }

  const prevStatus = customRequest.status;
  const {
    title,
    description,
    category,
    measurements,
    materials,
    estimatedPrice,
    agreedPrice,
    depositPaid,
    deadline,
    status,
    notes,
    whatsappSent,
    removeImageIds,
  } = req.body;

  // Process newly uploaded reference images
  const newImages = await Promise.all(
    (req.files || []).map(async (file) => {
      const result = await uploadToCloudinary(file.buffer);
      return { url: result.secure_url, publicId: result.public_id };
    })
  );

  // Remove images if requested
  if (removeImageIds) {
    const idsToRemove = Array.isArray(removeImageIds) ? removeImageIds : [removeImageIds];
    await deleteImages(idsToRemove);
    customRequest.referenceImages = customRequest.referenceImages.filter(
      (img) => !idsToRemove.includes(img.publicId)
    );
  }

  if (newImages.length > 0) {
    customRequest.referenceImages = [...customRequest.referenceImages, ...newImages].slice(0, 5);
  }

  if (title !== undefined) customRequest.title = title;
  if (description !== undefined) customRequest.description = description;
  if (category !== undefined) customRequest.category = category;
  if (estimatedPrice !== undefined) customRequest.estimatedPrice = Number(estimatedPrice);
  if (agreedPrice !== undefined) customRequest.agreedPrice = Number(agreedPrice);
  if (depositPaid !== undefined) customRequest.depositPaid = Number(depositPaid);
  if (deadline !== undefined) customRequest.deadline = deadline ? new Date(deadline) : null;
  if (status !== undefined) customRequest.status = status;
  if (notes !== undefined) customRequest.notes = notes;
  if (whatsappSent !== undefined) customRequest.whatsappSent = whatsappSent;

  if (materials !== undefined) {
    customRequest.materials = typeof materials === "string" ? JSON.parse(materials) : materials;
  }

  if (measurements !== undefined) {
    customRequest.measurements = normalizeMeasurements(measurements);
  }


  await customRequest.save();

  // Sync supplier purchases
  await syncSupplierMaterials(customRequest);

  // If status changed, notify and check if completed to update customer stats
  if (status && status !== prevStatus) {
    await createNotification(customRequest.vendor, {
      title: "Bespoke Status Updated",
      message: `Request "${customRequest.title}" status changed to "${status}".`,
      type: "order_status",
      actionUrl: `/dashboard/demands/${customRequest._id}`,
    });

    if (status === "completed" && prevStatus !== "completed" && customRequest.customer) {
      const finalRevenue = customRequest.agreedPrice || customRequest.estimatedPrice || 0;
      await Customer.findByIdAndUpdate(customRequest.customer, {
        $inc: { ltv: finalRevenue, orderCount: 1 },
        $set: { lastOrderDate: new Date() },
      });
    }
  }

  const reqObj = customRequest.toObject({ flattenMaps: true });
  reqObj.whatsappLinks = {
    quote: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "quote"),
    confirmed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "confirmed"),
    fitting: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "fitting"),
    completed: buildCustomRequestWhatsAppLink(req.vendor, reqObj, "completed"),
  };

  return sendSuccess(res, reqObj, "Custom request updated successfully");
});

/* ── DELETE /api/custom-requests/:id ────────────────────────────── */
export const deleteCustomRequest = asyncHandler(async (req, res) => {
  const customRequest = await CustomRequest.findOne({
    _id: req.params.id,
    vendor: req.vendor._id,
  });

  if (!customRequest) {
    return sendError(res, "Custom request not found", 404);
  }

  if (customRequest.status === "completed") {
    return sendError(res, "Completed bespoke requests cannot be deleted", 400);
  }

  // Cleanup reference images in Cloudinary
  if (customRequest.referenceImages?.length > 0) {
    const publicIds = customRequest.referenceImages.map((img) => img.publicId);
    await deleteImages(publicIds);
  }

  // Remove linked purchases from suppliers
  const suppliersWithPurchases = await Supplier.find({
    vendor: customRequest.vendor,
    "purchases.customRequest": customRequest._id,
  });

  for (const supp of suppliersWithPurchases) {
    supp.purchases = supp.purchases.filter(
      (p) => !p.customRequest || p.customRequest.toString() !== customRequest._id.toString()
    );
    await supp.save();
  }

  await customRequest.deleteOne();

  return sendSuccess(res, null, "Custom request deleted successfully");
});

/* ── PATCH /api/custom-requests/:id/materials/:materialIndex/toggle ── */
export const toggleMaterialAcquired = asyncHandler(async (req, res) => {
  const { id, materialIndex } = req.params;
  const customRequest = await CustomRequest.findOne({
    _id: id,
    vendor: req.vendor._id,
  });

  if (!customRequest) {
    return sendError(res, "Custom request not found", 404);
  }

  const idx = Number(materialIndex);
  if (!customRequest.materials[idx]) {
    return sendError(res, "Material item not found", 404);
  }

  customRequest.materials[idx].acquired = !customRequest.materials[idx].acquired;
  await customRequest.save();

  // Sync to supplier if assigned
  const mat = customRequest.materials[idx];
  if (mat.supplier) {
    const supplierId = typeof mat.supplier === "object" ? mat.supplier._id : mat.supplier;
    const supplier = await Supplier.findOne({ _id: supplierId, vendor: req.vendor._id });
    if (supplier) {
      const purchase = supplier.purchases.find(
        (p) =>
          p.customRequest &&
          p.customRequest.toString() === customRequest._id.toString() &&
          p.materialIndex === idx
      );
      if (purchase) {
        purchase.status = mat.acquired ? "delivered" : "ordered";
        purchase.paidAmount = mat.acquired ? purchase.amount : 0;
        await supplier.save();
      }
    }
  }

  return sendSuccess(
    res,
    customRequest.toObject({ flattenMaps: true }),
    "Material status updated"
  );
});

