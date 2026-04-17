/**
 * Curated list of common first names for PHI de-identification.
 * Used to scrub names mentioned mid-session (partners, kids, co-workers)
 * that aren't in the intake record.
 *
 * Source: U.S. SSA popular baby names, 1950-2020 (public domain).
 * Kept to ~700 high-frequency names to balance coverage vs false positives.
 *
 * Stored lowercased. Scanner matches capitalized-only to avoid false
 * positives on lowercase homographs ("hope" the verb vs "Hope" the name).
 *
 * AMBIGUOUS_NAMES are excluded even when capitalized — these double as
 * common words (months, virtues, nature words, etc.) and cause too many
 * false positives at start-of-sentence.
 */

const NAMES: readonly string[] = [
  // Top male names (mid-20th c. through present)
  'aaron', 'abraham', 'adam', 'adrian', 'aidan', 'alan', 'albert', 'alejandro', 'alex', 'alexander',
  'alexis', 'alfred', 'allen', 'alvin', 'amir', 'anderson', 'andre', 'andres', 'andrew', 'andy',
  'angel', 'anthony', 'antonio', 'ari', 'arjun', 'arnold', 'arthur', 'asher', 'ashton', 'austin',
  'avery', 'axel', 'barry', 'benjamin', 'bennett', 'benny', 'bernard', 'bill', 'billy', 'blake',
  'bobby', 'brad', 'bradley', 'brady', 'brandon', 'braxton', 'brayden', 'brendan', 'brent', 'brett',
  'brian', 'bruce', 'bryan', 'bryce', 'bryson', 'caleb', 'calvin', 'cameron', 'carl', 'carlos',
  'carson', 'carter', 'casey', 'cecil', 'cedric', 'charles', 'charlie', 'chester', 'chris', 'christian',
  'christopher', 'clarence', 'claude', 'clayton', 'clifford', 'clifton', 'clinton', 'clyde', 'cody', 'colby',
  'cole', 'colin', 'collin', 'colton', 'connor', 'conor', 'cooper', 'corey', 'cory', 'craig',
  'cristian', 'curtis', 'cyrus', 'dale', 'dallas', 'dalton', 'damian', 'damien', 'damon', 'dan',
  'daniel', 'danny', 'darin', 'darius', 'darrell', 'darren', 'darryl', 'darwin', 'dave', 'david',
  'davis', 'dean', 'deandre', 'declan', 'derek', 'derrick', 'desmond', 'devin', 'devon', 'dexter',
  'diego', 'dillon', 'dion', 'dominic', 'dominick', 'don', 'donald', 'donovan', 'douglas', 'drew',
  'duane', 'dustin', 'dwayne', 'dwight', 'dylan', 'earl', 'edgar', 'eddie', 'edmund', 'edward',
  'edwin', 'elias', 'elijah', 'elliot', 'elliott', 'emilio', 'emmanuel', 'enrique', 'eric', 'erik',
  'ernest', 'ernesto', 'esteban', 'ethan', 'eugene', 'evan', 'everett', 'ezekiel', 'ezra', 'felix',
  'fernando', 'floyd', 'forrest', 'francis', 'francisco', 'frank', 'franklin', 'fred', 'frederick', 'gabriel',
  'gage', 'garrett', 'gary', 'gavin', 'gene', 'geoffrey', 'george', 'gerald', 'gerardo', 'gilbert',
  'glen', 'glenn', 'gordon', 'grady', 'graham', 'grant', 'greg', 'gregory', 'griffin', 'guillermo',
  'gustavo', 'hank', 'harold', 'harrison', 'harry', 'harvey', 'hayden', 'hector', 'henry', 'herbert',
  'herman', 'hezekiah', 'hiram', 'holden', 'homer', 'horace', 'howard', 'hudson', 'hugh', 'hugo',
  'hunter', 'ian', 'ibrahim', 'ira', 'irving', 'isaac', 'isaiah', 'ivan', 'jack', 'jackson',
  'jacob', 'jaden', 'jake', 'jamal', 'james', 'jameson', 'jamie', 'jared', 'jason', 'javier',
  'jaxon', 'jaxson', 'jay', 'jayden', 'jayson', 'jeff', 'jefferson', 'jeffrey', 'jennings', 'jeremiah',
  'jeremy', 'jermaine', 'jerome', 'jerry', 'jesse', 'jessie', 'jesus', 'jim', 'jimmy', 'joaquin',
  'joe', 'joel', 'joey', 'johan', 'john', 'johnathan', 'johnny', 'jon', 'jonah', 'jonas',
  'jonathan', 'jordan', 'jorge', 'jose', 'joseph', 'joshua', 'josiah', 'juan', 'judah', 'jude',
  'julian', 'julio', 'julius', 'junior', 'justin', 'kai', 'kaleb', 'kareem', 'karl', 'kasey',
  'keanu', 'keaton', 'keenan', 'keith', 'kellen', 'kelvin', 'kendrick', 'kenneth', 'kenny', 'kent',
  'kevin', 'khalil', 'kirk', 'knox', 'kurt', 'kyle', 'kyrie', 'lamar', 'lance', 'landon',
  'larry', 'lawrence', 'lee', 'leland', 'leo', 'leon', 'leonard', 'leonardo', 'leroy', 'lester',
  'levi', 'lewis', 'liam', 'lincoln', 'linus', 'lionel', 'lloyd', 'logan', 'lorenzo', 'louis',
  'lucas', 'lucian', 'luis', 'luke', 'luther', 'lyle', 'mack', 'maddox', 'malachi', 'malcolm',
  'malik', 'manuel', 'marco', 'marcos', 'marcus', 'mario', 'marion', 'marlon', 'marshall', 'martin',
  'marty', 'marvin', 'mason', 'matt', 'matteo', 'matthew', 'maurice', 'max', 'maximilian', 'maximus',
  'maxwell', 'melvin', 'micah', 'michael', 'miguel', 'mike', 'miles', 'milo', 'milton', 'mitchell',
  'mohamed', 'mohammad', 'mohammed', 'moises', 'morgan', 'moses', 'muhammad', 'murray', 'myles', 'nash',
  'nathan', 'nathaniel', 'neil', 'nelson', 'nicholas', 'nick', 'nicolas', 'nikolai', 'noah', 'noel',
  'nolan', 'norman', 'octavio', 'odin', 'oliver', 'omar', 'orlando', 'oscar', 'otis', 'otto',
  'owen', 'pablo', 'paolo', 'parker', 'pascal', 'patrick', 'paul', 'paxton', 'pedro', 'percy',
  'perry', 'peter', 'phil', 'philip', 'phillip', 'pierce', 'porter', 'prescott', 'preston', 'quentin',
  'quincy', 'quinn', 'quinton', 'rafael', 'ralph', 'ramon', 'randall', 'randy', 'raphael', 'rashad',
  'raul', 'ray', 'raymond', 'reed', 'reese', 'reggie', 'reginald', 'renato', 'rene', 'reuben',
  'rex', 'rhett', 'ricardo', 'rich', 'richard', 'rick', 'ricky', 'riley', 'roberto', 'robert',
  'rocco', 'rocky', 'roderick', 'rodney', 'rodrigo', 'roger', 'roland', 'roman', 'romeo', 'ron',
  'ronald', 'ronnie', 'rory', 'roscoe', 'ross', 'roy', 'ruben', 'rudolph', 'rudy', 'rupert',
  'russell', 'rusty', 'ryan', 'ryder', 'sal', 'salvador', 'sam', 'samir', 'samson', 'samuel',
  'sanjay', 'santiago', 'saul', 'sawyer', 'scott', 'sean', 'sebastian', 'sergio', 'seth', 'shane',
  'shannon', 'shawn', 'sheldon', 'sherman', 'sidney', 'silas', 'simon', 'solomon', 'spencer', 'stan',
  'stanley', 'stefan', 'stephen', 'steve', 'steven', 'stewart', 'stuart', 'sylvester', 'tanner', 'tariq',
  'tate', 'taylor', 'terrance', 'terrell', 'terrence', 'terry', 'thaddeus', 'theo', 'theodore', 'thomas',
  'timmy', 'timothy', 'toby', 'todd', 'tom', 'tommy', 'tony', 'tracy', 'travis', 'trent',
  'trenton', 'trevor', 'trey', 'tristan', 'troy', 'tucker', 'tyler', 'tyrone', 'tyson', 'ulysses',
  'uriel', 'valentin', 'vance', 'vaughn', 'vernon', 'vicente', 'victor', 'vincent', 'virgil', 'wade',
  'walker', 'wallace', 'walter', 'warren', 'wayne', 'wendell', 'wesley', 'wilbur', 'willard', 'willem',
  'william', 'willie', 'wilson', 'winston', 'wyatt', 'xander', 'xavier', 'yahir', 'yosef', 'yusuf',
  'zachary', 'zachery', 'zane', 'zayden', 'zion',

  // Top female names (mid-20th c. through present)
  'abby', 'abigail', 'ada', 'adaline', 'adela', 'adeline', 'adriana', 'agatha', 'agnes', 'aileen',
  'aisha', 'alana', 'alaina', 'alba', 'alejandra', 'alexa', 'alexandra', 'alexandria', 'alexia', 'alexis',
  'alice', 'alicia', 'alina', 'alisha', 'alison', 'allison', 'alma', 'alyson', 'alyssa', 'amalia',
  'amanda', 'amber', 'amelia', 'amira', 'amy', 'ana', 'anastasia', 'andrea', 'angela', 'angelica',
  'angelina', 'angie', 'anika', 'anita', 'ann', 'anna', 'annabelle', 'anne', 'annette', 'annie',
  'antonia', 'araceli', 'ariana', 'ariel', 'ariella', 'arielle', 'aria', 'ashley', 'ashlyn', 'aspen',
  'astrid', 'athena', 'aubree', 'aubrey', 'audra', 'audrey', 'autumn', 'ava', 'avery', 'ayla',
  'barbara', 'beatrice', 'beatriz', 'becky', 'belinda', 'bella', 'benita', 'bernadette', 'bertha', 'beth',
  'bethany', 'betsy', 'betty', 'beverly', 'bianca', 'blanca', 'bonnie', 'brandi', 'brandy', 'breanna',
  'brenda', 'brianna', 'bridget', 'brittany', 'brooke', 'brooklyn', 'bryanna', 'caitlin', 'caitlyn', 'callie',
  'camila', 'camille', 'candace', 'candice', 'caren', 'carissa', 'carla', 'carly', 'carmen', 'carol',
  'carolina', 'caroline', 'carolyn', 'carrie', 'cassandra', 'cassidy', 'cassie', 'catalina', 'catherine', 'cathleen',
  'cathy', 'cecelia', 'cecilia', 'celeste', 'celia', 'celine', 'chanel', 'chanelle', 'chantal', 'charity',
  'charlene', 'charlotte', 'chelsea', 'chelsey', 'cherie', 'cherry', 'cheryl', 'cheyenne', 'chloe', 'chris',
  'christa', 'christen', 'christie', 'christina', 'christine', 'christy', 'ciara', 'cindy', 'claire', 'clara',
  'clarissa', 'claudia', 'colleen', 'connie', 'constance', 'cora', 'coral', 'corinne', 'courtney', 'cristina',
  'crystal', 'cynthia', 'daisy', 'dakota', 'dana', 'danae', 'daniela', 'danielle', 'daphne', 'darcy',
  'darla', 'darlene', 'deanna', 'debbie', 'deborah', 'debra', 'deirdre', 'delaney', 'delia', 'delilah',
  'della', 'denise', 'desiree', 'diana', 'diane', 'dianna', 'dianne', 'dolores', 'dominique', 'donna',
  'dora', 'doris', 'dorothy', 'edith', 'edna', 'eileen', 'elaina', 'elaine', 'eleanor', 'elena',
  'eliana', 'elise', 'elisabeth', 'elissa', 'eliza', 'elizabeth', 'ella', 'ellen', 'ellie', 'elsa',
  'elvira', 'emilia', 'emilie', 'emily', 'emma', 'erica', 'erika', 'erin', 'esmeralda', 'esperanza',
  'esther', 'estrella', 'eugenia', 'eunice', 'eva', 'eve', 'evelyn', 'evie', 'fatima', 'felicia',
  'fern', 'fernanda', 'fiona', 'flora', 'florence', 'frances', 'francesca', 'frankie', 'freida', 'frida',
  'gabriela', 'gabriella', 'gabrielle', 'gail', 'gemma', 'genesis', 'geneva', 'genevieve', 'georgia', 'georgina',
  'geraldine', 'gertrude', 'gigi', 'gina', 'ginger', 'ginny', 'gisele', 'giselle', 'gladys', 'gloria',
  'greta', 'gretchen', 'gwen', 'gwendolyn', 'gwyneth', 'haley', 'hallie', 'hanna', 'hannah', 'harriet',
  'hayley', 'hazel', 'heather', 'heidi', 'helen', 'helena', 'henrietta', 'hilda', 'holly', 'ida',
  'imani', 'imogene', 'ines', 'inez', 'ingrid', 'irene', 'iris', 'isabel', 'isabella', 'isabelle',
  'isadora', 'isla', 'ivanna', 'ivonne', 'ivy', 'jackie', 'jacqueline', 'jada', 'jade', 'jamie',
  'jana', 'jane', 'janelle', 'janet', 'janette', 'janice', 'janine', 'janis', 'jasmin', 'jasmine',
  'jayla', 'jayne', 'jazmin', 'jean', 'jeanette', 'jeanie', 'jeanne', 'jeannette', 'jeannie', 'jen',
  'jena', 'jenn', 'jenna', 'jennie', 'jennifer', 'jenny', 'jeri', 'jesse', 'jessica', 'jessie',
  'jill', 'jillian', 'jo', 'joan', 'joann', 'joanna', 'joanne', 'jocelyn', 'jodi', 'jodie',
  'jody', 'johanna', 'jolene', 'jordana', 'josefina', 'josephine', 'josie', 'juana', 'judith', 'judy',
  'julia', 'juliana', 'julianna', 'julianne', 'julie', 'juliet', 'julieta', 'juliette', 'julissa', 'june',
  'justine', 'kaitlin', 'kaitlyn', 'kaleigh', 'kalli', 'kara', 'karen', 'kari', 'karina', 'karla',
  'karma', 'kassandra', 'kate', 'katelyn', 'katharine', 'katherine', 'kathleen', 'kathryn', 'kathy', 'katie',
  'katrina', 'katy', 'kay', 'kayla', 'kaylee', 'keira', 'kelli', 'kellie', 'kelly', 'kelsey',
  'kendall', 'kendra', 'kenzie', 'kerri', 'kerry', 'keyla', 'khloe', 'kiara', 'kim', 'kimberly',
  'kinsley', 'kirsten', 'kristen', 'kristi', 'kristin', 'kristina', 'kristine', 'kristy', 'krystal', 'kyla',
  'kylie', 'lacey', 'laila', 'lana', 'lara', 'larissa', 'latoya', 'laura', 'laurel', 'lauren',
  'laurie', 'layla', 'lea', 'leah', 'leanna', 'leanne', 'leila', 'lena', 'leona', 'leonora',
  'lesley', 'leslie', 'leticia', 'lexi', 'lexie', 'lia', 'liana', 'libby', 'lidia', 'lila',
  'lilian', 'liliana', 'lilith', 'lillian', 'lilly', 'lily', 'lina', 'linda', 'lindsay', 'lindsey',
  'lisa', 'liv', 'livia', 'liz', 'liza', 'lizbeth', 'lizette', 'lois', 'lola', 'lorena',
  'loretta', 'lori', 'lorna', 'lorraine', 'louisa', 'louise', 'lucia', 'luciana', 'lucille', 'lucy',
  'luisa', 'luna', 'lupe', 'lydia', 'lynda', 'lynette', 'lynn', 'lynne', 'lynnette', 'mabel',
  'macy', 'madeleine', 'madeline', 'madelyn', 'madison', 'maeve', 'magdalena', 'maggie', 'maia', 'makayla',
  'makenna', 'malia', 'mallory', 'mara', 'marcella', 'marcia', 'margaret', 'margarita', 'margie', 'margo',
  'margot', 'maria', 'mariah', 'mariana', 'maribel', 'maricela', 'marie', 'marilyn', 'marina', 'marisa',
  'marisol', 'marissa', 'maritza', 'marjorie', 'marlene', 'marley', 'marsha', 'marta', 'martha', 'mary',
  'maryann', 'matilda', 'maureen', 'maya', 'mckenna', 'meagan', 'megan', 'meghan', 'melanie', 'melinda',
  'melisa', 'melissa', 'melody', 'mercedes', 'meredith', 'mia', 'michaela', 'michele', 'michelle', 'mikayla',
  'mila', 'mildred', 'millie', 'mindy', 'minnie', 'miranda', 'miriam', 'missy', 'misty', 'molly',
  'mona', 'monica', 'monique', 'morgan', 'muriel', 'myra', 'myrna', 'nadia', 'nadine', 'nancy',
  'naomi', 'natalia', 'natalie', 'natasha', 'nellie', 'nettie', 'nicole', 'nikki', 'nina', 'noelle',
  'nora', 'norah', 'noreen', 'norma', 'nova', 'nyla', 'octavia', 'olga', 'olive', 'olivia',
  'opal', 'oprah', 'ophelia', 'paige', 'pam', 'pamela', 'patience', 'patricia', 'patty', 'paula',
  'paulette', 'paulina', 'pauline', 'pearl', 'peggy', 'penelope', 'penny', 'phoebe', 'phyllis', 'piper',
  'polly', 'portia', 'priscilla', 'prudence', 'rachael', 'rachel', 'raegan', 'rafaela', 'ramona', 'randi',
  'raquel', 'raven', 'reagan', 'rebecca', 'rebekah', 'regina', 'renata', 'renee', 'reyna', 'rhea',
  'rhoda', 'rhonda', 'riley', 'rita', 'rivka', 'roberta', 'robin', 'robyn', 'rochelle', 'rocio',
  'ronda', 'rosa', 'rosalia', 'rosalie', 'rosalind', 'rosalyn', 'rosanna', 'rosario', 'rosemarie', 'rosemary',
  'rosie', 'rowan', 'roxana', 'roxanne', 'ruby', 'ruth', 'sabrina', 'sade', 'sadie', 'sally',
  'salma', 'samantha', 'sandra', 'sandy', 'sara', 'sarah', 'sarai', 'sasha', 'savannah', 'selena',
  'selma', 'serena', 'serenity', 'shannon', 'shari', 'sharon', 'shauna', 'shayla', 'sheila', 'shelby',
  'shelley', 'shelly', 'sheri', 'sherri', 'sherrie', 'sherry', 'shirley', 'sierra', 'silvia', 'simone',
  'sofia', 'sonia', 'sonja', 'sonya', 'sophia', 'sophie', 'stacey', 'staci', 'stacy', 'stella',
  'stephanie', 'stephany', 'sue', 'susan', 'susanna', 'susanne', 'suzanne', 'suzette', 'sydney', 'sylvia',
  'tabitha', 'talia', 'tamara', 'tammi', 'tammie', 'tammy', 'tania', 'tanya', 'tara', 'taryn',
  'tatiana', 'tatum', 'taylor', 'tayler', 'teagan', 'teresa', 'teri', 'terri', 'tessa', 'thea',
  'thelma', 'theresa', 'tia', 'tiana', 'tiara', 'tiffany', 'tina', 'tonia', 'tonya', 'tori',
  'traci', 'tracy', 'trina', 'trinity', 'trisha', 'twila', 'ursula', 'valentina', 'valeria', 'valerie',
  'vanessa', 'veda', 'velma', 'vera', 'veronica', 'vickie', 'vicky', 'victoria', 'viola', 'violet',
  'violeta', 'virginia', 'vivian', 'viviana', 'vivienne', 'wanda', 'wendy', 'whitney', 'wilma', 'willa',
  'winifred', 'xiomara', 'yadira', 'yasmin', 'yasmine', 'yesenia', 'yolanda', 'yvette', 'yvonne', 'zaria',
  'zelda', 'zena', 'zoe', 'zoey', 'zora',
]

/**
 * Names to SKIP even when capitalized — these overlap with common English
 * words (months, virtues, nature, nouns) and produce too many false positives.
 * If one of these is a legit person name in the transcript, it stays in plaintext.
 * Tradeoff: prevent "May I..." or "Hope it works" from masking the sentence.
 */
const AMBIGUOUS: readonly string[] = [
  // Months / days
  'may', 'june', 'april', 'august',
  // Virtues / feelings
  'hope', 'faith', 'grace', 'joy', 'patience', 'charity', 'serenity', 'trinity', 'harmony',
  'destiny', 'mercy', 'honor', 'justice', 'amen',
  // Nature / weather
  'rain', 'summer', 'autumn', 'dawn', 'sunny', 'star', 'sky', 'stormy', 'misty', 'windy',
  'river', 'ocean', 'forest', 'fern', 'holly', 'ivy', 'iris', 'rose', 'daisy', 'violet',
  'willow', 'laurel', 'aspen', 'coral', 'crystal', 'opal', 'pearl', 'ruby', 'jade', 'amber',
  // Common nouns / verbs
  'will', 'mark', 'rich', 'art', 'bill', 'hunter', 'parker', 'carter', 'taylor', 'mason',
  'walker', 'cooper', 'porter', 'reed', 'chase', 'miles', 'earl', 'duke', 'king', 'frank',
  'bob', 'pat', 'tip', 'chip', 'bud', 'bucky', 'cash', 'colt', 'cliff', 'dale', 'dean',
  'glenn', 'glen', 'jay', 'lee', 'ray', 'rex', 'rocky', 'roy',
  // Places that are also names
  'madison', 'kennedy', 'jefferson', 'lincoln', 'reagan', 'savannah',
  // Common greetings / short words
  'angel', 'lord',
]

export const FIRST_NAMES: ReadonlySet<string> = new Set(NAMES)
export const AMBIGUOUS_NAMES: ReadonlySet<string> = new Set(AMBIGUOUS)
