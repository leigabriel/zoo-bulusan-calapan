// Classes the animal classifier model can return. Keep in sync with
// frontend/public/model/bulusanzoo_machine_learning_v2/class_names.json.
const MODEL_CLASSES = [
    'Deer', 'Dove', 'Eagle', 'Horse', 'Human', 'Koi',
    'Monkey', 'Ostrich', 'Owl', 'Parrot', 'Rabbit', 'Tiger'
];

const isModelClass = (name) => typeof name === 'string' && MODEL_CLASSES.includes(name);

module.exports = { MODEL_CLASSES, isModelClass };
