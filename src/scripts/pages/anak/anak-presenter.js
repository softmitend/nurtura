import { getAnakList } from '../../data/anakApi.js';

const AnakPresenter = {
  async fetchAnakList(token) {
    return await getAnakList(token);
  }
};

export default AnakPresenter;
