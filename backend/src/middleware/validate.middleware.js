import ApiError from '../utils/apiError.js';

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const formatted = result.error.format();
        const messages = Object.entries(formatted)
          .filter(([key]) => key !== '_errors')
          .flatMap(([, value]) => {
            if (value && typeof value === 'object' && value._errors) {
              return value._errors;
            }
            return [];
          });
        throw ApiError.badRequest(
          messages.length > 0 ? messages.join('; ') : 'Validation failed',
          result.error.issues,
        );
      }

      req.body = result.data.body;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
