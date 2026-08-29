export const LOCAL_MODEL_CONFIG = {
    modelPath: '/model/bulusanzoo_machine_learning/model.json',
    inputSize: 224,
    confidenceThreshold: 0.5,
};

// This order must match the class_names used when the model was trained.
export const ANIMAL_CLASSES = [
    'Monkey',
    'Tiger',
    'Parrot',
    'Deer',
    'Dove',
    'Rabbit',
    'Horse',
    'Ostrich',
    'Owl',
    'Eagle',
    'Human',
];

export const ANIMAL_DATABASE = {
    Monkey: { category: 'Mammal', bulusan: true, icon: 'monkey' },
    Tiger: { category: 'Mammal', bulusan: true, icon: 'tiger' },
    Parrot: { category: 'Bird', bulusan: true, icon: 'parrot' },
    Deer: { category: 'Mammal', bulusan: true, icon: 'deer' },
    Dove: { category: 'Bird', bulusan: true, icon: 'dove' },
    Rabbit: { category: 'Mammal', bulusan: true, icon: 'rabbit' },
    Horse: { category: 'Mammal', bulusan: true, icon: 'horse' },
    Ostrich: { category: 'Bird', bulusan: false, icon: 'ostrich' },
    Owl: { category: 'Bird', bulusan: false, icon: 'owl' },
    Eagle: { category: 'Bird', bulusan: true, icon: 'eagle' },
    Human: { category: 'Human', bulusan: false, icon: 'human' },
};

export const getAnimalInfo = (animalName) => {
    return ANIMAL_DATABASE[animalName] || {
        category: 'Animal',
        bulusan: false,
        icon: animalName.toLowerCase(),
    };
};