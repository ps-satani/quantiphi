/**
 * Skill dictionary for the Tech Stack Compatibility score.
 * - aliases: how the skill may be written in a job description (matched as whole words, case-insensitive)
 * - exact:   case-sensitive aliases for short/ambiguous names ("C", "Go", "R")
 * - languages: GitHub linguist languages that count as proof of the skill
 * - keywords: extra words searched in repo names/topics/descriptions as weaker evidence
 */
export const SKILLS = [
  { skill: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'], languages: ['JavaScript'] },
  { skill: 'TypeScript', aliases: ['typescript', 'ts'], languages: ['TypeScript'] },
  { skill: 'Node.js', aliases: ['node', 'nodejs', 'node.js'], languages: ['JavaScript', 'TypeScript'], keywords: ['node', 'express'] },
  { skill: 'Express', aliases: ['express', 'expressjs', 'express.js'], languages: ['JavaScript', 'TypeScript'], keywords: ['express'] },
  { skill: 'React', aliases: ['react', 'reactjs', 'react.js'], languages: ['JavaScript', 'TypeScript'], keywords: ['react'] },
  { skill: 'Next.js', aliases: ['next.js', 'nextjs'], languages: ['JavaScript', 'TypeScript'], keywords: ['nextjs', 'next'] },
  { skill: 'Angular', aliases: ['angular', 'angularjs'], languages: ['TypeScript'], keywords: ['angular'] },
  { skill: 'Vue', aliases: ['vue', 'vuejs', 'vue.js'], languages: ['Vue'], keywords: ['vue'] },
  { skill: 'HTML', aliases: ['html', 'html5'], languages: ['HTML'] },
  { skill: 'CSS', aliases: ['css', 'css3', 'sass', 'scss', 'tailwind', 'tailwindcss'], languages: ['CSS', 'SCSS'] },
  { skill: 'Python', aliases: ['python'], languages: ['Python', 'Jupyter Notebook'] },
  { skill: 'Django', aliases: ['django'], languages: ['Python'], keywords: ['django'] },
  { skill: 'Flask', aliases: ['flask'], languages: ['Python'], keywords: ['flask'] },
  { skill: 'FastAPI', aliases: ['fastapi'], languages: ['Python'], keywords: ['fastapi'] },
  { skill: 'Machine Learning', aliases: ['machine learning', 'ml', 'deep learning', 'pytorch', 'tensorflow', 'scikit-learn', 'sklearn'], languages: ['Jupyter Notebook', 'Python'], keywords: ['ml', 'machine-learning', 'deep-learning', 'pytorch', 'tensorflow', 'model'] },
  { skill: 'Data Analysis', aliases: ['pandas', 'numpy', 'data analysis', 'data analytics'], languages: ['Jupyter Notebook', 'Python', 'R'], keywords: ['pandas', 'eda', 'analysis', 'data'] },
  { skill: 'Java', aliases: ['java', 'spring', 'spring boot', 'springboot'], languages: ['Java'] },
  { skill: 'Kotlin', aliases: ['kotlin'], languages: ['Kotlin'] },
  { skill: 'C++', aliases: ['c++', 'cpp'], languages: ['C++'] },
  { skill: 'C', exact: ['C'], languages: ['C'] },
  { skill: 'C#', aliases: ['c#', '.net', 'dotnet', 'asp.net'], languages: ['C#'] },
  { skill: 'Go', aliases: ['golang'], exact: ['Go'], languages: ['Go'] },
  { skill: 'Rust', aliases: ['rust'], languages: ['Rust'] },
  { skill: 'Ruby', aliases: ['ruby', 'rails', 'ruby on rails'], languages: ['Ruby'] },
  { skill: 'PHP', aliases: ['php', 'laravel'], languages: ['PHP'] },
  { skill: 'Swift', aliases: ['swift', 'ios'], languages: ['Swift'] },
  { skill: 'Dart', aliases: ['dart', 'flutter'], languages: ['Dart'] },
  { skill: 'R', exact: ['R'], languages: ['R'] },
  { skill: 'SQL', aliases: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'pl/sql', 'oracle'], languages: ['PLpgSQL', 'TSQL', 'PLSQL', 'SQL'], keywords: ['sql', 'mysql', 'postgres', 'postgresql', 'sqlite', 'database', 'dbms'] },
  { skill: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongoose'], languages: [], keywords: ['mongodb', 'mongo', 'mongoose', 'mern'] },
  { skill: 'Docker', aliases: ['docker', 'container', 'containers', 'containerization'], languages: ['Dockerfile'], keywords: ['docker'] },
  { skill: 'Kubernetes', aliases: ['kubernetes', 'k8s'], languages: [], keywords: ['kubernetes', 'k8s', 'helm'] },
  { skill: 'Shell', aliases: ['bash', 'shell', 'shell scripting', 'linux'], languages: ['Shell'], keywords: ['bash', 'shell', 'linux'] },
  { skill: 'AWS', aliases: ['aws', 'amazon web services', 'lambda', 'ec2', 's3'], languages: ['HCL'], keywords: ['aws', 'lambda', 'serverless'] },
  { skill: 'GraphQL', aliases: ['graphql'], languages: [], keywords: ['graphql'] },
];
