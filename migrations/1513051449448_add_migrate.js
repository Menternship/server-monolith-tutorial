exports.up = (pgm) => {
  pgm.createTable('posts', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    content: {
      type: 'string',
    },
    created_at: {
      type: 'date',
    },
    updated_at: {
      type: 'date',
    },
  });
};