const BASE_URL = "";

export async function getProfile(token) {
  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal ambil profile");
    }

    return result.data;
  } catch (error) {
    console.error("Gagal ambil profile:", error.message);
    return null;
  }
}

export async function createProfile(token, profileData) {
  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal membuat profile");
    }

    return result;
  } catch (error) {
    console.error("Gagal membuat profile:", error.message);
    return null;
  }
}

export async function updateProfile(token, profileData) {
  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal update profile");
    }

    return result;
  } catch (error) {
    console.error("Gagal update profile:", error.message);
    return null;
  }
}
