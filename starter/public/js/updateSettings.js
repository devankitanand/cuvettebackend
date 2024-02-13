//updateData
import axios from 'axios';
import { showAlert } from './alerts';
import { resolveContent } from 'nodemailer/lib/shared';

//type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated Successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const uploadPhotos = async (data, type) => {
  try {
    const res = await axios({
      method: 'POST',
      data,
    });

    console.log(res);
    if (res.data.status === '200') {
      showAlert('success', `Photo Uploaded Successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
