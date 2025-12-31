-- Add more graduate programs to the reference table
-- Includes NY-area programs and expanded national list

INSERT INTO public.graduate_programs (name, institution, program_type, accreditation, state) VALUES
  -- New York Area Programs
  ('Clinical Psychology', 'Long Island University Post', 'PsyD', 'APA', 'NY'),
  ('Clinical Psychology', 'Long Island University Brooklyn', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'Hofstra University', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'Adelphi University', 'PhD', 'APA', 'NY'),
  ('School-Clinical Child Psychology', 'Pace University', 'PsyD', 'APA', 'NY'),
  ('Clinical Psychology', 'Fordham University', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'St. Johns University', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'Yeshiva University', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'Teachers College, Columbia University', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'City University of New York', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'New School for Social Research', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'Stony Brook University', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'University at Buffalo', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'University at Albany', 'PhD', 'APA', 'NY'),
  ('Clinical Psychology', 'Syracuse University', 'PhD', 'APA', 'NY'),

  -- New Jersey Programs
  ('Clinical Psychology', 'Fairleigh Dickinson University', 'PhD', 'APA', 'NJ'),
  ('Clinical Psychology', 'Seton Hall University', 'PhD', 'APA', 'NJ'),
  ('School Psychology', 'Montclair State University', 'PsyD', 'APA', 'NJ'),

  -- Pennsylvania Programs
  ('Clinical Psychology', 'Drexel University', 'PhD', 'APA', 'PA'),
  ('Clinical Psychology', 'Temple University', 'PhD', 'APA', 'PA'),
  ('Clinical Psychology', 'Widener University', 'PsyD', 'APA', 'PA'),
  ('Clinical Psychology', 'Immaculata University', 'PsyD', 'APA', 'PA'),
  ('Clinical Psychology', 'La Salle University', 'PsyD', 'APA', 'PA'),
  ('Clinical Psychology', 'Philadelphia College of Osteopathic Medicine', 'PsyD', 'APA', 'PA'),
  ('Clinical Psychology', 'Chestnut Hill College', 'PsyD', 'APA', 'PA'),

  -- Massachusetts Programs
  ('Clinical Psychology', 'Boston University', 'PhD', 'APA', 'MA'),
  ('Clinical Psychology', 'Clark University', 'PhD', 'APA', 'MA'),
  ('Clinical Psychology', 'University of Massachusetts Amherst', 'PhD', 'APA', 'MA'),
  ('Clinical Psychology', 'University of Massachusetts Boston', 'PhD', 'APA', 'MA'),
  ('Clinical Psychology', 'Suffolk University', 'PhD', 'APA', 'MA'),
  ('Clinical Psychology', 'William James College', 'PsyD', 'APA', 'MA'),
  ('Clinical Psychology', 'Antioch University New England', 'PsyD', 'APA', 'NH'),

  -- Connecticut Programs
  ('Clinical Psychology', 'University of Hartford', 'PsyD', 'APA', 'CT'),
  ('Clinical Psychology', 'University of Connecticut', 'PhD', 'APA', 'CT'),

  -- Florida Programs
  ('Clinical Psychology', 'University of Miami', 'PhD', 'APA', 'FL'),
  ('Clinical Psychology', 'Florida State University', 'PhD', 'APA', 'FL'),
  ('Clinical Psychology', 'University of South Florida', 'PhD', 'APA', 'FL'),
  ('Clinical Psychology', 'University of Florida', 'PhD', 'APA', 'FL'),
  ('Clinical Psychology', 'Florida International University', 'PhD', 'APA', 'FL'),
  ('Clinical Psychology', 'Carlos Albizu University', 'PsyD', 'APA', 'FL'),

  -- California Programs (additional)
  ('Clinical Psychology', 'University of Southern California', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'University of California, San Diego', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'University of California, Irvine', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'University of California, Santa Barbara', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'San Diego State University/UC San Diego Joint Program', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'Fuller Theological Seminary', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'Loma Linda University', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'Pacific Graduate School of Psychology', 'PhD', 'APA', 'CA'),
  ('Clinical Psychology', 'California School of Professional Psychology', 'PsyD', 'APA', 'CA'),
  ('Clinical Psychology', 'Azusa Pacific University', 'PsyD', 'APA', 'CA'),
  ('Clinical Psychology', 'Biola University', 'PhD', 'APA', 'CA'),

  -- Midwest Programs
  ('Clinical Psychology', 'University of Iowa', 'PhD', 'APA', 'IA'),
  ('Clinical Psychology', 'University of Kansas', 'PhD', 'APA', 'KS'),
  ('Clinical Psychology', 'University of Missouri', 'PhD', 'APA', 'MO'),
  ('Clinical Psychology', 'Washington University in St. Louis', 'PhD', 'APA', 'MO'),
  ('Clinical Psychology', 'Saint Louis University', 'PhD', 'APA', 'MO'),
  ('Clinical Psychology', 'University of Nebraska-Lincoln', 'PhD', 'APA', 'NE'),
  ('Clinical Psychology', 'Ohio State University', 'PhD', 'APA', 'OH'),
  ('Clinical Psychology', 'Case Western Reserve University', 'PhD', 'APA', 'OH'),
  ('Clinical Psychology', 'University of Cincinnati', 'PhD', 'APA', 'OH'),
  ('Clinical Psychology', 'Kent State University', 'PhD', 'APA', 'OH'),
  ('Clinical Psychology', 'Bowling Green State University', 'PhD', 'APA', 'OH'),
  ('Clinical Psychology', 'Wright State University', 'PsyD', 'APA', 'OH'),
  ('Clinical Psychology', 'Indiana University', 'PhD', 'APA', 'IN'),
  ('Clinical Psychology', 'Purdue University', 'PhD', 'APA', 'IN'),
  ('Clinical Psychology', 'University of Notre Dame', 'PhD', 'APA', 'IN'),
  ('Clinical Psychology', 'Loyola University Chicago', 'PhD', 'APA', 'IL'),
  ('Clinical Psychology', 'Roosevelt University', 'PsyD', 'APA', 'IL'),
  ('Clinical Psychology', 'Illinois Institute of Technology', 'PhD', 'APA', 'IL'),
  ('Clinical Psychology', 'DePaul University', 'PhD', 'APA', 'IL'),
  ('Clinical Psychology', 'Rosalind Franklin University', 'PhD', 'APA', 'IL'),
  ('Clinical Psychology', 'Marquette University', 'PhD', 'APA', 'WI'),

  -- Southern Programs
  ('Clinical Psychology', 'Vanderbilt University', 'PhD', 'APA', 'TN'),
  ('Clinical Psychology', 'University of Tennessee', 'PhD', 'APA', 'TN'),
  ('Clinical Psychology', 'University of Memphis', 'PhD', 'APA', 'TN'),
  ('Clinical Psychology', 'University of Georgia', 'PhD', 'APA', 'GA'),
  ('Clinical Psychology', 'Georgia State University', 'PhD', 'APA', 'GA'),
  ('Clinical Psychology', 'Mercer University', 'PsyD', 'APA', 'GA'),
  ('Clinical Psychology', 'University of Alabama', 'PhD', 'APA', 'AL'),
  ('Clinical Psychology', 'Auburn University', 'PhD', 'APA', 'AL'),
  ('Clinical Psychology', 'University of Mississippi', 'PhD', 'APA', 'MS'),
  ('Clinical Psychology', 'Louisiana State University', 'PhD', 'APA', 'LA'),
  ('Clinical Psychology', 'University of Louisville', 'PhD', 'APA', 'KY'),
  ('Clinical Psychology', 'University of Kentucky', 'PhD', 'APA', 'KY'),
  ('Clinical Psychology', 'University of South Carolina', 'PhD', 'APA', 'SC'),
  ('Clinical Psychology', 'University of North Carolina at Chapel Hill', 'PhD', 'APA', 'NC'),
  ('Clinical Psychology', 'University of North Carolina at Charlotte', 'PhD', 'APA', 'NC'),
  ('Clinical Psychology', 'University of North Carolina at Greensboro', 'PhD', 'APA', 'NC'),

  -- Southwest Programs
  ('Clinical Psychology', 'Arizona State University', 'PhD', 'APA', 'AZ'),
  ('Clinical Psychology', 'University of Arizona', 'PhD', 'APA', 'AZ'),
  ('Clinical Psychology', 'University of New Mexico', 'PhD', 'APA', 'NM'),
  ('Clinical Psychology', 'University of Houston', 'PhD', 'APA', 'TX'),
  ('Clinical Psychology', 'University of North Texas', 'PhD', 'APA', 'TX'),
  ('Clinical Psychology', 'Texas Tech University', 'PhD', 'APA', 'TX'),
  ('Clinical Psychology', 'Baylor University', 'PsyD', 'APA', 'TX'),
  ('Clinical Psychology', 'University of Texas Southwestern Medical Center', 'PhD', 'APA', 'TX'),
  ('Clinical Psychology', 'Texas A&M University', 'PhD', 'APA', 'TX'),
  ('Clinical Psychology', 'University of Denver', 'PhD', 'APA', 'CO'),
  ('Clinical Psychology', 'University of Colorado Boulder', 'PhD', 'APA', 'CO'),
  ('Clinical Psychology', 'University of Colorado Denver', 'PhD', 'APA', 'CO'),
  ('Clinical Psychology', 'Colorado State University', 'PhD', 'APA', 'CO'),
  ('Clinical Psychology', 'University of Utah', 'PhD', 'APA', 'UT'),
  ('Clinical Psychology', 'Brigham Young University', 'PhD', 'APA', 'UT'),

  -- Pacific Northwest
  ('Clinical Psychology', 'University of Oregon', 'PhD', 'APA', 'OR'),
  ('Clinical Psychology', 'Pacific University', 'PsyD', 'APA', 'OR'),
  ('Clinical Psychology', 'Seattle Pacific University', 'PhD', 'APA', 'WA'),
  ('Clinical Psychology', 'University of Montana', 'PhD', 'APA', 'MT'),

  -- Other Notable Programs
  ('Clinical Psychology', 'George Washington University', 'PhD', 'APA', 'DC'),
  ('Clinical Psychology', 'American University', 'PhD', 'APA', 'DC'),
  ('Clinical Psychology', 'Howard University', 'PhD', 'APA', 'DC'),
  ('Clinical Psychology', 'Catholic University of America', 'PhD', 'APA', 'DC'),
  ('Clinical Psychology', 'University of Maryland, College Park', 'PhD', 'APA', 'MD'),
  ('Clinical Psychology', 'University of Maryland, Baltimore County', 'PhD', 'APA', 'MD'),
  ('Clinical Psychology', 'Uniformed Services University', 'PhD', 'APA', 'MD'),
  ('Clinical Psychology', 'Virginia Commonwealth University', 'PhD', 'APA', 'VA'),
  ('Clinical Psychology', 'Virginia Tech', 'PhD', 'APA', 'VA'),
  ('Clinical Psychology', 'Old Dominion University', 'PsyD', 'APA', 'VA'),
  ('Clinical Psychology', 'West Virginia University', 'PhD', 'APA', 'WV'),
  ('Clinical Psychology', 'University of Hawaii at Manoa', 'PhD', 'APA', 'HI')
ON CONFLICT (name, institution) DO NOTHING;

-- Update defaults for consent preferences table
ALTER TABLE public.user_consent_preferences
  ALTER COLUMN consent_research_contribution SET DEFAULT TRUE,
  ALTER COLUMN consent_marketing_communications SET DEFAULT TRUE;
