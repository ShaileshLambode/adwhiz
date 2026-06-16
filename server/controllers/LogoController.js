const Logo = require("../models/Logo");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");


// Create Logo
exports.createLogo = async (req, res) => {
  try {
    const { name, address, website, email, sector } = req.body;
    const user = req.user.id;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: "Name and address are required",
      });
    }



    let imageData = null;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "Post",
        });

        imageData = {
          url: result.secure_url,
          public_id: result.public_id,
        };

        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }

    const post = new Logo({
      user,
      name,
      address,
      website: website || '',
      email: email || '',
      sector: sector || '',
      images: imageData,
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Post creation error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};


// Get Logo
exports.getLogo = async (req, res) => {
  try {
    const user = req.user && req.user.id;
    const posts = await Logo.find({ user });
    if (!posts.length)
      return res.status(404).json({ success: false, message: "No Post found" });

    res.status(200).json({ success: true, message: "Post fetched", posts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching Post", error: err.message });
  }
};


// update Logo
exports.updateLogo = async (req, res) => {
  try {
    const postId = req.params.id;
    const { name, address, website, email, sector, removedImage } = req.body;

    const oldPost = await Logo.findById(postId);
    if (!oldPost) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Delete image if marked for removal
    if (
      removedImage &&
      oldPost.images &&
      oldPost.images.public_id === removedImage
    ) {
      try {
        await cloudinary.uploader.destroy(removedImage);
        oldPost.images = null;
      } catch (err) {
        console.warn("Image delete failed:", err.message);
      }
    }

    // Upload new image if present
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "posts"
        });
        oldPost.images = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadErr) {
        console.error("Image upload failed:", uploadErr.message);
      } finally {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.warn("Failed to delete local file:", err.message);
        }
      }
    }

    // Update fields
    if (name !== undefined) oldPost.name = name;
    if (address !== undefined) oldPost.address = address;
    if (website !== undefined) oldPost.website = website;
    if (email !== undefined) oldPost.email = email;
    if (sector !== undefined) oldPost.sector = sector;

    const updatedPost = await oldPost.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost
    });

  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ success: false, message: "Error updating post", error: err.message });
  }
};


// Delete Product
exports.deleteLogo = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Logo.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.images && post.images.public_id) {
      await cloudinary.uploader.destroy(post.images.public_id);
    }

    await Logo.findByIdAndDelete(postId);

    res.status(200).json({ success: true, message: "Post deleted successfully" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Error deleting post", error: err.message });
  }
};
