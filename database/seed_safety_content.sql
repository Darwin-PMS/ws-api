-- =============================================
-- Women Safety App - Seed Data for Safety Content
-- Run this file to populate initial safety content
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- PART 1: SAFETY TUTORIALS
-- =============================================

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Basic Self-Defense Techniques', 'Learn essential self-defense moves that can help you escape from dangerous situations.', 
'<h2>Introduction to Self-Defense</h2><p>Self-defense is about awareness, prevention, and avoidance. These basic techniques can help you protect yourself in emergency situations.</p><h3>Key Techniques:</h3><ul><li><strong>Awareness:</strong> Always be aware of your surroundings</li><li><strong>Stances:</strong> Maintain a balanced, ready stance</li><li><strong>Strikes:</strong> Palm strikes, elbow strikes, knee strikes</li><li><strong>Escapes:</strong> Wrist grabs, chokes, bear hugs</li></ul>',
'self-defense', NULL, 15, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Wrist Grab Escape Techniques', 'Master the art of escaping from wrist grabs using simple but effective techniques.',
'<h2>Escaping Wrist Grabs</h2><p>Being grabbed by the wrist is a common situation. Here is how to escape safely:</p><h3>Technique 1: Rotational Escape</h3><ol><li>Rotate your wrist in the direction of the thumb</li><li>The thumb is the weakest point of the grip</li><li>Pull sharply while rotating</li></ol><h3>Technique 2: Drop and Pull</h3><ol><li>Drop your body weight down</li><li>This reduces the grip strength</li><li>Pull free while they adjust</li></ol>',
'self-defense', NULL, 10, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Using Everyday Items for Self-Defense', 'Learn how to use common items as self-defense tools in emergencies.',
'<h2>Improvised Self-Defense Tools</h2><p>You can use everyday items as self-defense tools when nothing else is available.</p><h3>Effective Items:</h3><ul><li><strong>Keys:</strong> Hold between fingers for striking</li><li><strong>Umbrella:</strong> Can be used for striking or creating distance</li><li><strong>Pen/Pencil:</strong> Pointed objects can be used as last resort</li><li><strong>Bag with strap:</strong> Can be swung or used to entangle</li></ul>',
'self-defense', NULL, 12, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Escape from Chokes and Bear Hugs', 'Learn how to break free from chokes and bear hugs safely.',
'<h2>Breaking Free from Chokes</h2><p>Being choked is extremely dangerous. Here is how to escape:</p><h3>From Front Choke:</h3><ol><li>Protect your airway with your chin</li><li>Turn into the attacker arm</li><li>Create space to breathe</li><li>Strike to create escape opportunity</li></ol><h3>From Bear Hug:</h3><ol><li>Make a fist and strike back</li><li>Spread your legs for stability</li><li>Drop your weight</li><li>Break the grip and escape</li></ol>',
'self-defense', NULL, 15, 'intermediate', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Online Privacy and Security', 'Protect yourself from online threats with these essential digital safety tips.',
'<h2>Digital Safety Fundamentals</h2><p>In the digital age, online safety is as important as physical safety.</p><h3>Key Practices:</h3><ul><li><strong>Strong Passwords:</strong> Use unique, complex passwords for each account</li><li><strong>Two-Factor Authentication:</strong> Enable 2FA wherever possible</li><li><strong>Privacy Settings:</strong> Regularly review and update social media privacy</li><li><strong>Location Sharing:</strong> Be cautious about sharing real-time location</li></ul>',
'digital-safety', NULL, 20, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Safe Social Media Practices', 'Learn how to use social media safely and protect your personal information.',
'<h2>Social Media Safety Guide</h2><p>Social media can be a great tool for connection, but it is important to use it safely.</p><h3>Do is:</h3><ul><li>Review privacy settings regularly</li><li>Only accept requests from people you know</li><li>Think before posting - once online, always online</li><li>Report inappropriate contact immediately</li></ul><h3>Do not is:</h3><ul><li>Do not share your exact location in real-time</li><li>Do not post about empty homes or vacations</li><li>Do not share personal details with strangers</li></ul>',
'digital-safety', NULL, 15, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Identifying and Avoiding Online Predators', 'Learn to recognize red flags and protect yourself from online predators.',
'<h2>Online Predator Awareness</h2><p>Online predators often use manipulation tactics to build trust. Learn to identify them.</p><h3>Warning Signs:</h3><ul><li>Quickly professing love or strong feelings</li><li>Asking for personal information early</li><li>Asking you to keep conversations secret</li><li>Sending inappropriate content</li><li>Asking to meet in person</li></ul>',
'digital-safety', NULL, 18, 'intermediate', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Public Transportation Safety', 'Stay safe while using buses, trains, and other public transportation.',
'<h2>Public Transport Safety Tips</h2><p>Public transportation is convenient but requires extra awareness.</p><h3>Before Your Journey:</h3><ul><li>Share your route with someone you trust</li><li>Keep your phone charged</li><li>Know the emergency numbers on that route</li></ul><h3>During Your Journey:</h3><ul><li>Sit near the driver or conductor</li><li>Stay alert and aware</li><li>Keep valuables secure</li><li>Trust your instincts - change seats if uncomfortable</li></ul>',
'travel-safety', NULL, 18, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Night Travel Safety Guide', 'Essential tips for staying safe when traveling at night.',
'<h2>Night Travel Safety</h2><p>Nighttime travel requires extra precautions. Here is how to stay safe:</p><h3>Planning Ahead:</h3><ul><li>Plan your route in advance</li><li>Choose well-lit, busy routes</li><li>Let someone know your ETA</li><li>Keep emergency contacts saved and accessible</li></ul><h3>Ride-Sharing Safety:</h3><ul><li>Verify the driver and vehicle before entering</li><li>Share your trip details with someone</li><li>Sit in the back seat</li></ul>',
'travel-safety', NULL, 20, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Safety When Using Ride-Sharing Apps', 'Learn to use ride-sharing services safely.',
'<h2>Ride-Sharing Safety</h2><p>Ride-sharing apps are convenient but require safety precautions.</p><h3>Before Getting In:</h3><ul><li>Verify license plate matches the app</li><li>Confirm the driver name and photo</li><li>Check that the car matches the description</li><li>Do not get in if something feels wrong</li></ul><h3>During the Ride:</h3><ul><li>Sit in the back seat</li><li>Share your trip with a friend or family member</li><li>Follow your own route on your phone</li></ul>',
'travel-safety', NULL, 15, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Workplace Harassment Prevention', 'Learn to identify, prevent, and respond to workplace harassment.',
'<h2>Understanding Workplace Harassment</h2><p>Everyone deserves a safe work environment. Learn how to protect yourself and others.</p><h3>Types of Harassment:</h3><ul><li>Verbal harassment (comments, jokes, slurs)</li><li>Physical harassment (unwanted touching)</li><li>Visual harassment (inappropriate images, gestures)</li><li>Cyber harassment (emails, messages, social media)</li></ul><h3>What You Can Do:</h3><ol><li>Document everything (dates, times, witnesses)</li><li>Report to HR or management</li><li>Know your company policies</li></ol>',
'workplace-safety', NULL, 25, 'intermediate', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Building Confidence and Assertiveness', 'Develop the confidence to speak up and set boundaries.',
'<h2>Being Assertive for Safety</h2><p>Confidence and assertiveness are powerful tools for personal safety.</p><h3>Why Assertiveness Matters:</h3><ul><li>Predators often target those who seem timid</li><li>Being clear reduces misunderstandings</li><li>It helps you set boundaries effectively</li></ul><h3>Practice Assertiveness:</h3><ul><li>Make eye contact when speaking</li><li>Speak clearly and at a normal volume</li><li>Use firm but polite language</li><li>Do not apologize for having boundaries</li></ul>',
'workplace-safety', NULL, 20, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'SOS Alert System Tutorial', 'Learn how to effectively use the SOS alert system in emergencies.',
'<h2>Using Your SOS Alert</h2><p>Your safety app SOS feature is designed to get you help quickly in emergencies.</p><h3>How SOS Works:</h3><ol><li>Activate SOS with one tap</li><li>Your location is immediately shared</li><li>Emergency contacts are notified</li><li>Audio recording begins automatically</li></ol><h3>When to Use SOS:</h3><ul><li>If you feel physically threatened</li><li>If you are in an unsafe situation</li><li>If you need immediate help</li></ul>',
'emergency-response', NULL, 10, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Emergency Communication Skills', 'Learn how to communicate effectively during emergencies.',
'<h2>Emergency Communication</h2><p>Knowing how to communicate during emergencies can save lives.</p><h3>Calling for Help:</h3><ul><li>Stay calm and speak clearly</li><li>Provide your exact location</li><li>Describe the emergency situation</li><li>Stay on the line until help arrives</li></ul><h3>Essential Information to Provide:</h3><ul><li>Your name and phone number</li><li>Exact location/address</li><li>Type of emergency</li><li>Number of people involved</li></ul>',
'emergency-response', NULL, 15, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Creating a Personal Safety Plan', 'Develop a comprehensive safety plan for yourself.',
'<h2>Personal Safety Planning</h2><p>Having a safety plan can help you react quickly and effectively in emergencies.</p><h3>Your Safety Plan Should Include:</h3><ul><li><strong>Emergency Contacts:</strong> List 3-5 people who can help quickly</li><li><strong>SOS Activation:</strong> Know how to use your emergency app</li><li><strong>Safe Places:</strong> Identify police stations, hospitals, busy shops near your routes</li><li><strong>Safe Words:</strong> Create code words with family/friends</li></ul>',
'emergency-response', NULL, 20, 'beginner', FALSE, TRUE, NOW());

-- =============================================
-- PART 2: QUICK TIPS
-- =============================================

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Stay Aware of Your Surroundings', 'Always be mindful of what is happening around you. Avoid distractions like excessive phone use when walking alone.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Share Your Location with Trusted Contacts', 'Keep your location sharing enabled with close family members or friends.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Trust Your Instincts', 'If a person or situation makes you uncomfortable, remove yourself immediately.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Keep Emergency Contacts Accessible', 'Save emergency numbers in your phone and have them ready.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Use Well-Lit and Busy Routes', 'When walking alone, especially at night, choose well-lit, populated paths.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Check Your Ride Before Entering', 'Always verify the license plate and driver details match before entering any ride-share vehicle.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Keep Your Phone Charged', 'Your phone is your lifeline. Keep it charged when traveling and consider carrying a portable charger.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Avoid Headphones While Walking Alone', 'Remove or lower your headphones when walking alone, especially at night.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Review Privacy Settings Regularly', 'Check your social media and app privacy settings frequently.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Be Cautious with Online Connections', 'Only accept friend requests from people you know. Be wary of strangers.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Never Share Sensitive Photos Online', 'Once a photo is shared online, you lose control of it.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Use Strong, Unique Passwords', 'Create different strong passwords for each account.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Scream and Run if Attacked', 'If grabbed or attacked, make loud noise, scream for help, and run toward crowds.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Know Your Nearest Safe Locations', 'Identify safe places near your regular routes - police stations, busy shops.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

INSERT INTO safety_tutorials (id, title, description, content, category, image_url, video_url, duration, difficulty, is_premium, is_active, created_at) VALUES
(UUID(), 'Use the Panic Button Feature', 'Keep your phone emergency SOS feature accessible.', 
'quick_tips', NULL, NULL, 5, 'beginner', FALSE, TRUE, NOW());

-- =============================================
-- PART 3: SAFETY LAWS
-- =============================================

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Sexual Harassment of Women at Workplace Act, 2013', 
'Protection of women against sexual harassment at workplace and for the establishment of Internal Complaints Committee.',
'<h2>Overview</h2><p>The Sexual Harassment of Women at Workplace Act was enacted to ensure safe working environment for women.</p><h3>Key Provisions:</h3><ul><li>Every workplace with 10+ employees must have an ICC</li><li>Definition includes verbal, physical, and visual harassment</li><li>3-month deadline for complaint resolution</li><li>Protection against victimization during inquiry</li></ul>',
'workplace', 'India', '2013-12-09', 
'Compensation to be paid to victim, disciplinary action including termination. Non-compliance can result in fines up to Rs. 50,000.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Maternity Benefit Amendment Act, 2017', 
'Amendment to the Maternity Benefit Act providing enhanced benefits to women employees.',
'<h2>Key Benefits</h2><p>The amendment increased paid maternity leave and introduced new provisions for women workers.</p><h3>Key Provisions:</h3><ul><li>Paid maternity leave of 26 weeks</li><li>12 weeks paid leave for commissioning and adopting mothers</li><li>Option for work-from-home after 26 weeks</li><li>Creche facility mandatory for establishments with 50+ employees</li></ul>',
'workplace', 'India', '2017-03-28', 
'Non-compliance can result in penalties and imprisonment up to 1 year for employer.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Indian Penal Code Section 354 - Assault on Women', 
'Punishment for assault or criminal force to woman with intent to outrage her modesty.',
'<h2>Section 354 IPC</h2><p>Whoever makes any gesture or any preparation intending that such gesture will cause a woman to think he is about to use criminal force on her, shall be punished.</p><h3>Key Points:</h3><ul><li>Covers assault with intent to outrage modesty</li><li>Includes disrobing a woman</li><li>Punishment: Up to 5 years imprisonment plus fine</li><li>Non-bailable offense</li></ul>',
'criminal', 'India', '1860-01-01', 
'Imprisonment up to 5 years and fine. For disrobing, imprisonment up to 7 years.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Indian Penal Code Section 354A - Sexual Harassment', 
'Definition and punishment for sexual harassment.',
'<h2>Section 354A IPC</h2><p>Sexual harassment includes unwelcome sexual behavior that makes a woman feel offended, humiliated, or intimidated.</p><h3>What It Covers:</h3><ul><li>Physical contact and advances</li><li>A demand or request for sexual favors</li><li>Showing pornography without consent</li><li>Making sexually colored remarks</li></ul><h3>Punishment:</h3><ul><li>For physical contact: Up to 3 years imprisonment plus fine</li><li>For other forms: Up to 1 year imprisonment plus fine</li></ul>',
'criminal', 'India', '2013-02-03', 
'Imprisonment up to 3 years for physical contact, 1 year for other forms, plus fine.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Indian Penal Code Section 354B - Assault with Intent to Disrobe', 
'Punishment for assault with intent to force woman to strip.',
'<h2>Section 354B IPC</h2><p>Whoever makes an assault or uses criminal force to any woman and thereby strips her of her garments, or compels her to be naked, shall be punished with rigorous imprisonment.</p><h3>Punishment:</h3><p>Imprisonment not less than 3 years, up to 7 years, and shall also be liable to fine.</p>',
'criminal', 'India', '2013-02-03', 
'Imprisonment not less than 3 years, up to 7 years, and fine.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Indian Penal Code Section 354C - Voyeurism', 
'Punishment for voyeurism - watching or capturing images of woman in private.',
'<h2>Section 354C IPC</h2><p>Any man who watches a woman engaging in a private act or captures images of her in private without her consent, commits voyeurism.</p><h3>Key Points:</h3><ul><li>Covers watching woman in private without consent</li><li>Includes capturing images or videos</li><li>Sharing such content is also punishable</li></ul><h3>Punishment:</h3><ul><li>First conviction: Up to 1 year imprisonment plus fine</li><li>Subsequent conviction: Up to 3 years imprisonment plus fine</li></ul>',
'criminal', 'India', '2013-02-03', 
'First offense: Up to 1 year imprisonment plus fine. Subsequent: Up to 3 years plus fine.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Indian Penal Code Section 354D - Stalking', 
'Punishment for stalking of women.',
'<h2>Section 354D IPC</h2><p>Any man who follows a woman or contacts her repeatedly despite clear indication of disinterest, or monitors her use of internet, commits stalking.</p><h3>Examples of Stalking:</h3><ul><li>Following a woman repeatedly</li><li>Sending unwanted messages or emails</li><li>Calling woman repeatedly without consent</li><li>Watching her home or workplace</li><li>Tracking her online activity</li></ul><h3>Punishment:</h3><ul><li>First conviction: Up to 3 years imprisonment plus fine</li><li>Subsequent conviction: Up to 5 years imprisonment plus fine</li></ul>',
'criminal', 'India', '2013-02-03', 
'First offense: Up to 3 years plus fine. Subsequent: Up to 5 years plus fine.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Indian Penal Code Section 376 - Rape', 
'Punishment for rape under Indian law.',
'<h2>Section 376 IPC</h2><p>Rape is a serious criminal offense punishable under Section 376 of the Indian Penal Code.</p><h3>Key Points:</h3><ul><li>Sexual intercourse without consent constitutes rape</li><li>Sexual intercourse under false pretenses is rape</li><li>Sexual intercourse with a minor is always rape</li></ul><h3>Punishment:</h3><p>Rigorous imprisonment for a term which shall not be less than 10 years, but which may extend to imprisonment for life, and shall also be liable to fine.</p>',
'criminal', 'India', '1860-01-01', 
'Imprisonment not less than 10 years, up to life imprisonment, and fine.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Protection of Women from Domestic Violence Act, 2005', 
'Providing protection to women against domestic violence and relief measures.',
'<h2>Overview</h2><p>The DV Act provides protection to women who are victims of domestic violence and provides for relief through protection officers.</p><h3>What Constitutes Domestic Violence:</h3><ul><li>Physical abuse (hitting, beating, pushing)</li><li>Sexual abuse (forced sexual acts)</li><li>Verbal and emotional abuse (insults, humiliation)</li><li>Economic abuse (denying financial resources)</li><li>Stalking and dowry-related harassment</li></ul><h3>Rights Under the Act:</h3><ul><li>Right to protection order</li><li>Right to residence order</li><li>Right to maintenance</li><li>Right to compensation</li></ul>',
'domestic', 'India', '2005-09-13', 
'Violators can face protection orders, monetary relief, and custody orders.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Dowry Prohibition Act, 1961', 
'Prohibition of giving and taking dowry.',
'<h2>Dowry Prohibition Act</h2><p>The Act prohibits the giving and taking of dowry at or before or any time after marriage.</p><h3>Key Provisions:</h3><ul><li>Giving or taking dowry is a criminal offense</li><li>Demand for dowry is prohibited</li><li>Includes gifts given at marriage without coercion</li></ul><h3>Punishment:</h3><ul><li>Giving or taking dowry: Up to 6 months imprisonment plus fine</li><li>Demand for dowry: Up to 2 years imprisonment plus fine</li></ul>',
'domestic', 'India', '1961-05-01', 
'Giving or taking dowry: Up to 6 months imprisonment plus fine. Demand for dowry: Up to 2 years imprisonment plus fine.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Anti-Dowry Harassment Laws', 
'Laws specifically addressing dowry-related harassment and cruelty.',
'<h2>Dowry Death and Cruelty</h2><p>Section 304B and 498A of IPC address dowry-related deaths and cruelty.</p><h3>Section 304B - Dowry Death:</h3><ul><li>Death of woman within 7 years of marriage</li><li>Death caused by burns, bodily injury, or suicide</li><li>Proven harassment for dowry before death</li></ul><h3>Section 498A - Cruelty:</h3><ul><li>Wilful conduct causing mental or physical suffering</li><li>Cruelty by husband or relatives of husband</li></ul>',
'domestic', 'India', '1983-01-01', 
'Section 304B: Minimum 7 years imprisonment, up to life. Section 498A: Up to 3 years plus fine.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'IT Act Section 66E - Invasion of Privacy', 
'Punishment for publishing or transmitting private images without consent.',
'<h2>Section 66E IT Act</h2><p>Whoever captures, publishes, or transmits an image of a private area of any person without his or her consent, shall be punished.</p><h3>Key Points:</h3><ul><li>Covers capturing private parts without consent</li><li>Publishing such content online is also covered</li><li>Sharing through messaging apps is punishable</li></ul><h3>Punishment:</h3><p>Imprisonment up to 3 years and fine up to Rs. 2 lakhs.</p>',
'cyber', 'India', '2000-06-09', 
'Imprisonment up to 3 years and fine up to Rs. 2,00,000.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'IT Act Section 66C - Identity Theft', 
'Punishment for cheating by personation using digital means.',
'<h2>Section 66C IT Act</h2><p>Whoever cheats by personation using computer resource or any other means shall be punished.</p><h3>Examples:</h3><ul><li>Using someone photos to create fake profiles</li><li>Impersonating someone on social media</li><li>Using stolen identity to deceive others</li></ul><h3>Punishment:</h3><p>Imprisonment up to 3 years and fine up to Rs. 1 lakh.</p>',
'cyber', 'India', '2000-06-09', 
'Imprisonment up to 3 years and fine up to Rs. 1,00,000.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'IT Act Section 67 - Publishing Obscene Content', 
'Punishment for publishing or transmitting obscene content in electronic form.',
'<h2>Section 67 IT Act</h2><p>Whoever publishes or transmits in the electronic form any material which is lascivious or appeals to the prurient interest shall be punished.</p><h3>What It Covers:</h3><ul><li>Publishing obscene content online</li><li>Sharing pornographic material</li><li>Creating or distributing explicit content without consent</li></ul><h3>Punishment:</h3><ul><li>First conviction: Up to 3 years imprisonment plus fine up to Rs. 5 lakhs</li><li>Subsequent conviction: Up to 5 years imprisonment plus fine up to Rs. 10 lakhs</li></ul>',
'cyber', 'India', '2000-06-09', 
'First offense: Up to 3 years plus fine up to Rs. 5 lakhs. Subsequent: Up to 5 years plus fine up to Rs. 10 lakhs.', 
TRUE, NOW());

INSERT INTO safety_laws (id, title, description, content, category, jurisdiction, effective_date, penalty, is_active, created_at) VALUES
(UUID(), 'Motor Vehicles Act Section 194 - Drunk Driving', 
'Punishment for driving under influence of alcohol or drugs.',
'<h2>Drunk Driving Provisions</h2><p>The Motor Vehicles Act prescribes strict penalties for driving under the influence of alcohol or drugs.</p><h3>Blood Alcohol Limits:</h3><ul><li>Private vehicles: 30 mg per 100 ml of blood</li><li>Commercial vehicles: 0 mg (zero tolerance)</li></ul><h3>For Women Drivers:</h3><p>The law applies equally to women drivers. Being under influence reduces ability to react to dangers.</p>',
'road-safety', 'India', '2019-09-01', 
'First offense: Up to 6 months imprisonment and/or fine up to Rs. 10,000. Subsequent: Up to 2 years and/or fine up to Rs. 15,000.', 
TRUE, NOW());

-- =============================================
-- PART 4: SAFETY NEWS
-- =============================================

INSERT INTO safety_news (id, title, summary, content, category, author, is_featured, is_active, views_count, created_at) VALUES
(UUID(), 
'New Safety App Features Launch to Enhance Women Safety',
'Major update brings improved SOS features and real-time location sharing.',
'<h2>New Safety Features Released</h2><p>We are excited to announce significant upgrades to our women safety application, focusing on rapid response capabilities and enhanced location tracking.</p><h3>Key New Features:</h3><ul><li>One-tap SOS activation</li><li>Automatic location sharing with emergency contacts</li><li>Audio recording during emergencies</li><li>Integration with local police services</li></ul><p>These features are designed to provide women with greater confidence when moving around independently.</p>',
'safety-features', 'Safety App Team', TRUE, TRUE, 1250, NOW());

INSERT INTO safety_news (id, title, summary, content, category, author, is_featured, is_active, views_count, created_at) VALUES
(UUID(), 
'Government Launches Women Safety Helpline Across All States',
'Unified emergency helpline 181 now operational in all states for women safety.',
'<h2>181 Helpline Now Nationwide</h2><p>The Ministry of Women and Child Development has announced the expansion of the 181 women helpline service to all states across the country.</p><h3>Services Available:</h3><ul><li>24/7 emergency response</li><li>Counseling services</li><li>Legal aid referrals</li><li>Shelter home information</li></ul><p>Women can now access these services by simply dialing 181 from any phone.</p>',
'government-initiative', 'News Desk', TRUE, TRUE, 2340, NOW());

INSERT INTO safety_news (id, title, summary, content, category, author, is_featured, is_active, views_count, created_at) VALUES
(UUID(), 
'Self-Defense Training Programs to be Expanded in Schools',
'Ministry announces comprehensive self-defense training for girls in schools.',
'<h2>Self-Defense Training in Education</h2><p>The Ministry of Education has announced a new program to introduce self-defense training in schools across the country.</p><h3>Program Highlights:</h3><ul><li>Training for girls from Class 6 onwards</li><li>Qualified martial arts instructors</li><li>Basic self-defense techniques</li><li>Awareness about personal safety</li></ul><p>The program aims to build confidence and awareness among young girls about their safety.</p>',
'education', 'Education Desk', FALSE, TRUE, 890, NOW());

INSERT INTO safety_news (id, title, summary, content, category, author, is_featured, is_active, views_count, created_at) VALUES
(UUID(), 
'Tech Companies Partner for Enhanced Digital Safety for Women',
'Major technology companies announce collaboration on women safety features.',
'<h2>Tech Giants Join Forces for Safety</h2><p>Leading technology companies have announced a partnership to develop enhanced digital safety features for women.</p><h3>Initiatives:</h3><ul><li>Shared database of reported harassers</li><li>Cross-platform safety alerts</li><li>Enhanced reporting mechanisms</li><li>AI-powered threat detection</li></ul><p>This collaboration marks a significant step toward creating a safer digital environment for women.</p>',
'technology', 'Tech Desk', TRUE, TRUE, 1560, NOW());

INSERT INTO safety_news (id, title, summary, content, category, author, is_featured, is_active, views_count, created_at) VALUES
(UUID(), 
'New Fast-Track Courts for Violence Against Women Announced',
'Government establishes fast-track courts for quicker justice delivery.',
'<h2>Fast-Track Courts for Women Safety Cases</h2><p>The government has announced the establishment of fast-track courts specifically for cases involving violence against women.</p><h3>Key Features:</h3><ul><li>Cases to be decided within 6 months</li><li>Specialized judges for sensitive handling</li><li>Video conferencing for victim testimony</li><li>Support services for survivors</li></ul><p>These courts aim to reduce the backlog of cases and provide faster justice to victims.</p>',
'legal', 'Legal Desk', FALSE, TRUE, 720, NOW());

INSERT INTO safety_news (id, title, summary, content, category, author, is_featured, is_active, views_count, created_at) VALUES
(UUID(), 
'Panic Button Mandate for Public Transport',
'All public transport vehicles to have emergency panic buttons installed.',
'<h2>Panic Buttons in Public Transport</h2><p>The government has mandated the installation of panic buttons in all public transport vehicles including buses, autos, and taxis.</p><h3>Implementation:</h3><ul><li>All new vehicles must have GPS and panic buttons</li><li>Existing vehicles to be retrofitted</li><li>Direct connection to police control rooms</li><li>Real-time tracking of vehicles</li></ul><p>This initiative aims to provide immediate assistance to women using public transport.</p>',
'government-initiative', 'Transport Desk', FALSE, TRUE, 650, NOW());

INSERT INTO safety_news (id, title, summary, content, category, author, is_featured, is_active, views_count, created_at) VALUES
(UUID(), 
'National Registry of Sexual Offenders Launched',
'Government launches database to track and monitor convicted sexual offenders.',
'<h2>Sexual Offenders Registry</h2><p>A national database of convicted sexual offenders has been launched to improve tracking and prevent repeat offenses.</p><h3>Features:</h3><ul><li>Comprehensive database of offenders</li><li>Photo and biometric data</li><li>Geographic tracking of offenders</li><li>Public access to check offenders in area</li></ul><p>This registry aims to create a safer environment by increasing transparency and awareness.</p>',
'legal', 'Legal Desk', TRUE, TRUE, 1890, NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- END OF SEED DATA
-- =============================================
