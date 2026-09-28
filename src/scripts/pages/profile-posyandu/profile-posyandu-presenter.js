import {
  getProfile,
  createProfile,
  updateProfile,
} from "../../data/profileApi";

const ProfilePosyanduPresenter = {
  async init(view) {
    this._view = view;
    await this._fetchProfile();
  },

  async _fetchProfile() {
    const token = localStorage.getItem("token");

    try {
      const result = await getProfile(token);

      if (result) {
        this._view.renderProfile(result);
      } else {
        this._view.renderCreateForm();
      }
    } catch (error) {
      console.error("❌ Error mengambil profile:", error.message);
      this._view.renderCreateForm();
    }
  },

  async saveProfile(profileData) {
    const token = localStorage.getItem("token");

    try {
      await createProfile(token, profileData);
      await this._fetchProfile();
    } catch (error) {
      console.error("❌ Error saat membuat profile:", error.message);
      throw error;
    }
  },

  async updateProfile(profileData) {
    const token = localStorage.getItem("token");

    try {
      await updateProfile(token, profileData);
      await this._fetchProfile();
    } catch (error) {
      console.error("❌ Error saat memperbarui profile:", error.message);
      throw error;
    }
  },
};

export default ProfilePosyanduPresenter;
