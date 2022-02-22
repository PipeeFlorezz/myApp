const { Schema, model} = require('mongoose');

const schemaMessage = new Schema({
    emitter: {type: Schema.ObjectId, ref: 'Usuario'},
    reciever: {type: Schema.ObjectId, ref: 'Usuario'},
    text: String
}, {
    timestamps: true,
    versionkey: false
});

module.exports = model('Message', schemaMessage);

