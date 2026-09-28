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

  _renderCreateFormWithPendingName() {
    this._view.renderCreateForm();

    const pendingName = localStorage.getItem("pending_posyandu_name")?.trim();
    const nameInput = document.getElementById("namaPosyandu");
    if (pendingName && nameInput && !nameInput.value) {
      nameInput.value = pendingName;
    }
  },

  async _fetchProfile() {
    const token = localStorage.getItem("token");

    try {
      const result = await getProfile(token);

      if (result) {
        localStorage.removeItem("pending_posyandu_name");
        this._view.renderProfile(result);
      } else {
        this._renderCreateFormWithPendingName();
      }
    } catch (error) {
      console.error("❌ Error mengambil profile:", error.message);
      this._renderCreateFormWithPendingName();
    }
  },

  async saveProfile(profileData) {
    const token = localStorage.getItem("token");

    try {
      await createProfile(token, profileData);
      localStorage.removeItem("pending_posyandu_name");
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
