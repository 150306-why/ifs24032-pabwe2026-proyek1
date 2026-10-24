/**
 * Memvalidasi bagian request (body/query/params) dengan skema zod.
 * Hasil parse (sudah dibersihkan dan di-coerce) disimpan di req.valid[source].
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error); // ditangani errorHandler -> 422
    req.valid = { ...req.valid, [source]: result.data };
    return next();
  };
}

module.exports = validate;
