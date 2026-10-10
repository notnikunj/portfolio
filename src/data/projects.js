// Projects 

export const projects = [
  {
    slug: 'isl-translator',
    title: 'ISL Translator',
    category: 'Machine learning',
    year: '2025',
    context: 'BSc final-year project, University of Hertfordshire',
    summary:
      'Real-time recognition of Indian Sign Language alphabet signs from a webcam, shown as on-screen text.',
    problem:
      'Bridge part of the communication gap for Deaf and hard-of-hearing people by translating static ISL alphabet signs into text as they are made.',
    approach: [
      'Transfer learning on ResNet50 (ImageNet weights, frozen base) with a small custom classification head.',
      'Around 51,000 images: a public Kaggle ISL alphabet dataset plus roughly 800 self-collected images per letter.',
      'Augmentation (rotation, flips, zoom) and regularisation (L2, dropout, early stopping).',
      'An OpenCV pipeline that classifies webcam frames live.',
    ],
    outcome:
      'About 96.4% test accuracy. The most common confusions were J and K, U and V, and C, I and L. Static signs only, and sensitive to lighting and background.',
    tools: ['Python', 'TensorFlow', 'ResNet50', 'OpenCV'],
    links: [
      { label: 'Final report (PDF)', href: 'docs/isl-translator-final-report.pdf' },
      
    ],
    schematic: 'confusion',
  },
  {
    slug: 'uk-housing-investment',
    title: 'UK Housing Investment Analysis',
    category: 'Data science',
    year: 2026, 
    context: null,
    summary:
      'An investment score for UK areas that combines house prices with deprivation, income and crime.',
    problem:
      'House prices alone say little about long-term investment potential. The question was which areas look strong once economic conditions, deprivation and safety are taken into account.',
    approach: [
      'Joined HM Land Registry Price Paid data, the ONS Postcode Directory, police.uk crime data and the Indices of Multiple Deprivation (2019) in PostgreSQL.',
      'Matched postcodes to boroughs with a nearest-neighbour search (SciPy cKDTree).',
      'Built a weighted investment score: low deprivation and high income raise it, high crime lowers it.',
      'Compared scores with price history from 1995 to 2023.',
    ],
    outcome:
      'An interactive Streamlit dashboard with a postcode heatmap, score trends over time, and a price-against-score scatter for spotting areas that look undervalued.',
    tools: ['Python', 'pandas', 'SQLAlchemy', 'SciPy', 'PostgreSQL', 'Plotly', 'Streamlit'],
    links: [
      { label: 'Write-up (PDF)', href: 'docs/uk-housing-investment-analysis.pdf' },
      
    ],
    schematic: 'scatter',
  },
  {
    slug: 'pca-diabetic-diagnosis',
    title: 'PCA for Diabetic Diagnosis',
    category: 'Machine learning',
    year: '2024',
    context: 'Coursework, Machine Learning & Neural Computing, University of Hertfordshire',
    summary:
      'Classifying diabetes status from seven health indicators, with PCA to see how separable the classes really are.',
    problem:
      'Support early detection of diabetes from routine indicators: BMI, general, mental and physical health, age, education and income.',
    approach: [
      'Two-component PCA to explore the structure of the data.',
      'An RBF-kernel support vector machine on standardised features, tuned on a held-out validation split.',
      'Separate models for physically active and inactive groups, then each tested on the other group.',
    ],
    outcome:
      'Roughly 73–75% test accuracy. The principal components showed substantial overlap between classes, which explains the ceiling.',
    tools: ['Python', 'pandas', 'scikit-learn', 'Matplotlib', 'Seaborn'],
    links: [{ label: 'Report (PDF)', href: 'docs/pca-diabetes-classification-report.pdf' }],
    schematic: 'pca',
  },
  {
    slug: 'music-recommendation',
    title: 'Music Recommendation Engine',
    category: 'Machine learning',
    year: 2026, 
    context: null,
    summary:
      'A content-based recommender that finds similar tracks in a 10,000-song dataset.',
    problem: null, 
    approach: [
      'Represented each track by tempo, timbre and a TF-IDF vector of its text description.',
      'Reduced dimensions with PCA and found nearest neighbours with KNN.',
    ],
    outcome: null, 
    tools: ['Python', 'TF-IDF', 'PCA', 'KNN'],
    links: [
      
    ],
    schematic: 'knn',
  },
  {
    slug: 'voyager',
    title: 'Voyager',
    category: 'Mobile app',
    year: 2025, 
    context: null,
    summary: 'A cross-platform travel-planning app built on real-time Google Places data.',
    problem: null, 
    approach: ['Built in React Native, pulling places live from the Google Places API.'],
    outcome: 'A 40% increase in user engagement time during testing.',
    tools: ['React Native', 'JavaScript', 'Google Places API'],
    links: [],
    schematic: 'route',
  },
  {
    slug: 'parcel-management',
    title: 'Parcel Management Software',
    category: 'Software engineering',
    year: 2024, 
    context: null,
    summary: 'A Java desktop application for managing parcels, built around a model–view–controller design.',
    problem: null, 
    approach: [
      'MVC architecture with a Java back end that logs every transaction.',
      'A Swing interface that updates in real time.',
    ],
    outcome: 'Handles more than 1,000 transactions.',
    tools: ['Java', 'Swing', 'MVC'],
    links: [],
    schematic: 'mvc',
  },
];
