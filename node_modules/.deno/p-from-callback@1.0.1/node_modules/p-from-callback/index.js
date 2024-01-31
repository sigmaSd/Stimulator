export default (fn, multi = false) => new Promise((resolve, reject) => {
  fn(
    (error, ...result) => (
      error
        ? reject(error)
        : resolve(multi ? result : result[0])
    ),
  );
});
