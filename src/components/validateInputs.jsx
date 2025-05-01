const validateLoginInputs = (email, password, setError) => {
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return false;
    }
    return true;
  };

  export default validateLoginInputs;