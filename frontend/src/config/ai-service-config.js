export const LOCAL_MODEL_CONFIG = {
    modelPath: '/model/bulusanzoo_machine_learning_v2/model.json',
    inputSize: 224,
    // Top class must reach this score...
    confidenceThreshold: 0.7,
    // ...and beat the runner-up by this much. Photos of things the model was never
    // trained on (plants, objects) tend to produce split scores, so they fail this.
    minMargin: 0.25,
    // Stricter bar for classes that are often wrongly picked for unrelated photos.
    classThresholds: {
        Koi: 0.9,
    },
};

// This order must match the index_to_class in class_names.json of the v2 model.
export const ANIMAL_CLASSES = [
    'Deer',
    'Dove',
    'Eagle',
    'Horse',
    'Human',
    'Koi',
    'Monkey',
    'Ostrich',
    'Owl',
    'Parrot',
    'Rabbit',
    'Tiger',
];

export const ANIMAL_DATABASE = {
    Deer: { category: 'Mammal', bulusan: true, icon: 'deer' },
    Dove: { category: 'Bird', bulusan: true, icon: 'dove' },
    Eagle: { category: 'Bird', bulusan: true, icon: 'eagle' },
    Horse: { category: 'Mammal', bulusan: true, icon: 'horse' },
    Human: { category: 'Human', bulusan: false, icon: 'human' },
    Koi: { category: 'Fish', bulusan: false, icon: 'koi' },
    Monkey: { category: 'Mammal', bulusan: true, icon: 'monkey' },
    Ostrich: { category: 'Bird', bulusan: false, icon: 'ostrich' },
    Owl: { category: 'Bird', bulusan: false, icon: 'owl' },
    Parrot: { category: 'Bird', bulusan: true, icon: 'parrot' },
    Rabbit: { category: 'Mammal', bulusan: true, icon: 'rabbit' },
    Tiger: { category: 'Mammal', bulusan: true, icon: 'tiger' },
};

export const getAnimalInfo = (animalName) => {
    return ANIMAL_DATABASE[animalName] || {
        category: 'Animal',
        bulusan: false,
        icon: animalName.toLowerCase(),
    };
};