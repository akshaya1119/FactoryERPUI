import CryptoJS from 'crypto-js';

const secretKey = 'Xj9K2mLp3Qr7Zt6F8wA1bC5dE9gH3iN'; // 32-digit random character secret key

export const encrypt = (id) => {
  const ciphertext = CryptoJS.AES.encrypt(id.toString(), secretKey).toString();
  return ciphertext.replace(/\//g, ';');
};

export const decrypt = (encryptedString) => {
  const restoredString = encryptedString.replace(/;/g, '/');
  const bytes = CryptoJS.AES.decrypt(restoredString, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};