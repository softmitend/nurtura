import {
  getAnakById,
  deleteAnakById,
  updateAnakById,
  tambahPemeriksaan,
} from "../../data/anakApi.js";
import getRiwayatAnak from "../../data/riwayat-api.js";

const DetailAnakPresenter = {
  async fetchDetailAnak(token, id) {
    return await getAnakById(token, id);
  },

  async fetchRiwayat(token, id) {
    return await getRiwayatAnak(id, token);
  },

  async updateIdentitas(token, id, payload) {
    return await updateAnakById(token, id, payload);
  },

  async tambahPemeriksaan(token, payload) {
    return await tambahPemeriksaan(token, payload);
  },

  async hapusAnak(token, id) {
    return await deleteAnakById(token, id);
  },
};

export default DetailAnakPresenter;
