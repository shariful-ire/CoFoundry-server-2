import User from '../models/User.js';

/* PATCH /api/users/profile */
export async function updateProfile(req, res) {
  try {
    const { name, bio, skills, image } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, bio, skills, image },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
