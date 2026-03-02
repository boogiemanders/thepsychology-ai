-- Seed first homepage A/B experiment with 7 variants

-- Insert experiment
INSERT INTO hp_experiments (id, name, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'homepage-section-order-v1',
  'active'
);

-- Variant 1: Control (current order)
INSERT INTO hp_variants (experiment_id, name, weight, section_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'control',
  1,
  '{orbiting,bento,testimonials,pricing,faq,company}'
);

-- Variant 2: Pricing early — surfaces social proof + pricing faster
INSERT INTO hp_variants (experiment_id, name, weight, section_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'pricing-early',
  1,
  '{testimonials,pricing,orbiting,bento,faq,company}'
);

-- Variant 3: Social first — leads with trust signals
INSERT INTO hp_variants (experiment_id, name, weight, section_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'social-first',
  1,
  '{testimonials,company,bento,orbiting,pricing,faq}'
);

-- Variant 4: FAQ objection buster — answers "is this legit?" early
INSERT INTO hp_variants (experiment_id, name, weight, section_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'faq-objection-buster',
  1,
  '{testimonials,faq,bento,orbiting,pricing,company}'
);

-- Variant 5: Product first — lead with features for search-intent visitors
INSERT INTO hp_variants (experiment_id, name, weight, section_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'product-first',
  1,
  '{bento,orbiting,testimonials,pricing,faq,company}'
);

-- Variant 6: Late pricing — build max value before showing price
INSERT INTO hp_variants (experiment_id, name, weight, section_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'late-pricing',
  1,
  '{orbiting,bento,testimonials,company,faq,pricing}'
);

-- Variant 7: Trust sandwich — open with credibility, social proof before pricing
INSERT INTO hp_variants (experiment_id, name, weight, section_order)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'trust-sandwich',
  1,
  '{company,orbiting,bento,testimonials,pricing,faq}'
);
