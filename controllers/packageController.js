const Package = require('../models/Package');
const cloudinary = require('../config/cloudinary');
const { validationResult } = require('express-validator');
const ApiError = require('../utils/helpers').ApiError;

// Get all packages (public)
exports.getPackages = async (req, res, next) => {
    try {
        const query = {};

        // Search: name/location/destination
        if (req.query.search) {
            const q = String(req.query.search);
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { destination: { $regex: q, $options: 'i' } },
                { location: { $regex: q, $options: 'i' } },
            ];
        }

        // Destination (backward compatible)
        if (req.query.destination) query.destination = { $regex: String(req.query.destination), $options: 'i' };

        // Filters
        const category = req.params.category || req.query.category;
        if (category) query.category = String(category).toLowerCase();
        if (req.query.featured) query.featured = true;

        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
        }
        if (req.query.minDuration || req.query.maxDuration) {
            query.duration = {};
            if (req.query.minDuration) query.duration.$gte = Number(req.query.minDuration);
            if (req.query.maxDuration) query.duration.$lte = Number(req.query.maxDuration);
        }

        // Sort
        let sort = '-createdAt';
        if (req.query.sort === 'price_asc') sort = 'price';
        if (req.query.sort === 'price_desc') sort = '-price';
        if (req.query.sort === 'rating_desc') sort = '-rating';

        if (req.query.includeInactive !== 'true') {
            query.active = true;
        }

        const packages = await Package.find(query).sort(sort);
        res.json({ success: true, count: packages.length, data: packages });
    } catch (error) {
        next(error);
    }
};

// Get single package
exports.getPackage = async (req, res, next) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) throw new ApiError('Package not found', 404);
        res.json({ success: true, data: pkg });
    } catch (error) {
        next(error);
    }
};

// Create package (admin only)
exports.createPackage = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ApiError('Validation failed', 400, errors.array()));
        }
        // 'images' is array of files processed by upload middleware
        const imageFiles = req.files || [];
        const images = imageFiles.map(file => ({
            url: file.path,       // Cloudinary URL
            public_id: file.filename // Cloudinary public_id
        }));

        const packageData = {
            ...req.body,
            ...(images.length ? { images } : {}),
            highlights: req.body.highlights ? req.body.highlights.split(',').map(h => h.trim()) : [],
            includes: req.body.includes ? req.body.includes.split(',').map(i => i.trim()) : [],
            amenities: req.body.amenities ? req.body.amenities.split(',').map(a => a.trim()) : [],
            itinerary: req.body.itinerary ? req.body.itinerary.split(',').map(i => i.trim()) : [],
            subDestinations: req.body.subDestinations ? req.body.subDestinations.split(',').map(s => s.trim()) : [],
        };
        const pkg = await Package.create(packageData);
        res.status(201).json({ success: true, data: pkg });
    } catch (error) {
        next(error);
    }
};

// Update package (admin)
exports.updatePackage = async (req, res, next) => {
    try {
        let pkg = await Package.findById(req.params.id);
        if (!pkg) throw new ApiError('Package not found', 404);

        // If new images are uploaded, delete old ones from Cloudinary
        if (req.files && req.files.length > 0) {
            // Delete old images from Cloudinary
            if (pkg.images && pkg.images.length > 0) {
                for (const img of pkg.images) {
                    if (img.public_id) {
                        await cloudinary.uploader.destroy(img.public_id).catch(err => console.error('Cloudinary destroy error:', err));
                    }
                }
            }
            const images = req.files.map(file => ({
                url: file.path,
                public_id: file.filename,
            }));
            req.body.images = images;
        } else if (req.body.images && typeof req.body.images === 'string') {
            // If images are sent as string (e.g. from a form field containing JSON), parse them
            try {
                req.body.images = JSON.parse(req.body.images);
            } catch (e) {
                console.error('Failed to parse images string:', e);
            }
        }
        // Parse arrays if present
        const arrayFields = ['amenities', 'itinerary', 'highlights', 'includes', 'subDestinations'];
        arrayFields.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                if (req.body[field].startsWith('[')) {
                    try {
                        req.body[field] = JSON.parse(req.body[field]);
                    } catch (e) {
                        req.body[field] = req.body[field].split(',').map(item => item.trim());
                    }
                } else {
                    req.body[field] = req.body[field].split(',').map(item => item.trim());
                }
            }
        });

        pkg = await Package.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        res.json({ success: true, data: pkg });
    } catch (error) {
        next(error);
    }
};

// Delete package (admin)
exports.deletePackage = async (req, res, next) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) throw new ApiError('Package not found', 404);
        // Delete all associated images from Cloudinary
        for (const img of pkg.images) {
            await cloudinary.uploader.destroy(img.public_id);
        }
        await pkg.deleteOne();
        res.json({ success: true, message: 'Package removed' });
    } catch (error) {
        next(error);
    }
};

exports.enablePackage = async (req, res, next) => {
    try {
        const pkg = await Package.findByIdAndUpdate(
            req.params.id,
            { active: true },
            { new: true, runValidators: true }
        );
        if (!pkg) throw new ApiError('Package not found', 404);
        res.json({ success: true, message: 'Package enabled', data: pkg });
    } catch (error) {
        next(error);
    }
};

exports.disablePackage = async (req, res, next) => {
    try {
        const pkg = await Package.findByIdAndUpdate(
            req.params.id,
            { active: false },
            { new: true, runValidators: true }
        );
        if (!pkg) throw new ApiError('Package not found', 404);
        res.json({ success: true, message: 'Package disabled', data: pkg });
    } catch (error) {
        next(error);
    }
};

exports.toggleStatus = async (req, res, next) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) throw new ApiError('Package not found', 404);
        pkg.active = req.body.active !== undefined ? Boolean(req.body.active) : !pkg.active;
        await pkg.save();
        res.json({ success: true, message: 'Package status updated', data: pkg });
    } catch (error) {
        next(error);
    }
};

exports.toggleFeatured = async (req, res, next) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) throw new ApiError('Package not found', 404);
        pkg.featured = req.body.featured !== undefined ? Boolean(req.body.featured) : !pkg.featured;
        await pkg.save();
        res.json({ success: true, message: 'Package featured status updated', data: pkg });
    } catch (error) {
        next(error);
    }
};
