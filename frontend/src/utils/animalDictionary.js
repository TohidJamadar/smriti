/**
 * animalDictionary.js
 * Curated list of 220+ common animal names for FluencyTest validation.
 * Provides exact-match and fuzzy-match (Levenshtein distance) helpers.
 */

export const ANIMALS = [
  // Mammals
  'cat', 'dog', 'cow', 'pig', 'goat', 'sheep', 'horse', 'donkey', 'mule', 'rabbit',
  'rat', 'mouse', 'hamster', 'gerbil', 'guinea pig', 'squirrel', 'chipmunk', 'beaver',
  'otter', 'mole', 'hedgehog', 'porcupine', 'badger', 'weasel', 'ferret', 'mongoose',
  'fox', 'wolf', 'coyote', 'jackal', 'hyena', 'lion', 'tiger', 'leopard', 'cheetah',
  'jaguar', 'puma', 'cougar', 'lynx', 'bobcat', 'ocelot', 'bear', 'grizzly', 'panda',
  'polar bear', 'koala', 'kangaroo', 'wallaby', 'wombat', 'possum', 'opossum',
  'platypus', 'echidna', 'elephant', 'rhinoceros', 'rhino', 'hippopotamus', 'hippo',
  'giraffe', 'zebra', 'wildebeest', 'antelope', 'gazelle', 'deer', 'elk', 'moose',
  'reindeer', 'caribou', 'bison', 'buffalo', 'yak', 'camel', 'llama', 'alpaca',
  'sloth', 'anteater', 'armadillo', 'monkey', 'baboon', 'gorilla', 'chimpanzee',
  'orangutan', 'gibbon', 'lemur', 'marmoset', 'capuchin', 'macaque', 'mandrill',
  'bat', 'meerkat', 'raccoon', 'skunk',
  // Birds
  'eagle', 'hawk', 'falcon', 'owl', 'parrot', 'macaw', 'cockatoo', 'parakeet',
  'budgerigar', 'budgie', 'canary', 'finch', 'sparrow', 'robin', 'swallow', 'swift',
  'pigeon', 'dove', 'crow', 'raven', 'magpie', 'jay', 'starling', 'myna', 'peacock',
  'pheasant', 'turkey', 'chicken', 'hen', 'rooster', 'duck', 'goose', 'swan',
  'flamingo', 'pelican', 'stork', 'heron', 'crane', 'ibis', 'kingfisher', 'woodpecker',
  'toucan', 'hornbill', 'penguin', 'ostrich', 'emu', 'cassowary', 'kiwi', 'condor',
  'vulture', 'albatross', 'seagull', 'puffin', 'hummingbird', 'nightingale', 'cuckoo',
  // Reptiles & Amphibians
  'snake', 'cobra', 'python', 'boa', 'viper', 'mamba', 'rattlesnake', 'anaconda',
  'lizard', 'gecko', 'iguana', 'chameleon', 'monitor', 'komodo', 'crocodile',
  'alligator', 'caiman', 'turtle', 'tortoise', 'terrapin', 'frog', 'toad', 'salamander',
  'newt', 'axolotl',
  // Fish & Marine
  'fish', 'shark', 'whale', 'dolphin', 'porpoise', 'seal', 'walrus', 'sea lion',
  'manatee', 'dugong', 'octopus', 'squid', 'cuttlefish', 'jellyfish', 'starfish',
  'crab', 'lobster', 'shrimp', 'prawn', 'clam', 'oyster', 'mussel', 'snail',
  'salmon', 'tuna', 'trout', 'bass', 'cod', 'herring', 'mackerel', 'sardine',
  'eel', 'ray', 'swordfish', 'clownfish', 'goldfish', 'catfish', 'carp',
  // Insects & Invertebrates
  'ant', 'bee', 'wasp', 'butterfly', 'moth', 'dragonfly', 'grasshopper', 'cricket',
  'beetle', 'ladybug', 'cockroach', 'fly', 'mosquito', 'spider', 'scorpion',
  'centipede', 'millipede', 'earthworm', 'snail', 'slug', 'caterpillar',
];

/**
 * Compute Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Validate a word against the animal dictionary.
 * @param {string} word  — already lowercased & trimmed
 * @returns {{ status: 'valid'|'typo'|'invalid', suggestion: string|null }}
 */
export function validateAnimal(word) {
  // 1. Exact match
  if (ANIMALS.includes(word)) {
    return { status: 'valid', suggestion: null };
  }

  // 2. Fuzzy match — find closest animal within edit distance 2
  let best = null;
  let bestDist = Infinity;
  for (const animal of ANIMALS) {
    // Only compare if lengths are close (perf guard)
    if (Math.abs(animal.length - word.length) > 3) continue;
    const d = levenshtein(word, animal);
    if (d < bestDist) {
      bestDist = d;
      best = animal;
    }
  }

  if (bestDist <= 2) {
    return { status: 'typo', suggestion: best };
  }

  // 3. Not an animal
  return { status: 'invalid', suggestion: null };
}
