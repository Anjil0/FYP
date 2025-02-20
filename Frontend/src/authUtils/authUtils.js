const isValidToken = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate > new Date();
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return false;
  }
};

export { isValidToken };
