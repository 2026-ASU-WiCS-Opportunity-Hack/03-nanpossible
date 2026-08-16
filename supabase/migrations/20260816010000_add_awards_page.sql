-- ============================================================
-- Migration: Add WIAL Awards page
-- Date: 2026-08-16
-- Description:
--   Insert the global "awards" page (slug: awards), consolidating
--   wial.org/awards (award categories), /award-nomination (criteria
--   and eligibility rules; the live nomination form stays on
--   wial.org per the Better World pattern), and
--   /previous-wial-award-winners (2015-2019 and 2024 winners kept
--   in a timeline; 2021-2023 summarized because the source lists
--   winners only as slide images). Ceremony photo vendored under
--   public/awards/ (no hotlinking). Upserts so re-runs converge.
-- ============================================================

insert into public.content_pages (
    id,
    chapter_id,
    slug,
    title,
    published,
    body_richtext,
    seo,
    created_at,
    updated_at
)
values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0013',
    null,
    'awards',
    'WIAL Awards',
    true,
    jsonb_build_object(
        'heroIntro', 'Every year WIAL presents awards to spectacular individuals and organizations who demonstrate Action Learning in their work. From applications in education and research to companies achieving results through Action Learning, the awards are prestigious and a true sign of achievement.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Award categories', 'value', '5'),
            jsonb_build_object('label', 'Years of winners', 'value', '10+'),
            jsonb_build_object('label', 'Marquardt research prize', 'value', '$500')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'media_prose',
                'title', 'Recognition across the community',
                'image', '/awards/wial-awards.jpg',
                'imageAlt', 'An Affiliate of the Year award being presented with a handshake at a WIAL global conference',
                'imagePosition', 'right',
                'paragraphs', jsonb_build_array(
                    'WIAL award winners span the full breadth of the Action Learning community — coaches whose teams and clients vouch for their impact, researchers advancing the method, organizations applying Action Learning at scale, and volunteers bringing it to communities that could not otherwise afford it.',
                    'Awards are presented each year at WIAL''s global conference or virtual Action Learning week, and winners join an honor roll that reaches back more than a decade.'
                )
            ),
            jsonb_build_object(
                'type', 'feature_grid',
                'title', 'Award categories',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Application Award',
                        'body', 'Recognizes high-impact applications of WIAL Action Learning, measured by the scale of programs run, the impact of the projects addressed, the use of certified coaches, and the visibility the work has earned.'
                    ),
                    jsonb_build_object(
                        'title', 'Innovation Award',
                        'body', 'Celebrates organizations and individuals who created a unique solution using WIAL Action Learning, with an emphasis on creative ways of integrating the methodology.'
                    ),
                    jsonb_build_object(
                        'title', 'Coaching Excellence Award',
                        'body', 'Recognizes superior coaching, demonstrated through endorsements and praise from team members and clients.'
                    ),
                    jsonb_build_object(
                        'title', 'Marquardt Research Award',
                        'body', 'Honors published work that contributes to the body of Action Learning knowledge. Named for WIAL co-founder Dr. Michael Marquardt, the award includes a $500 prize.'
                    ),
                    jsonb_build_object(
                        'title', 'Pro Bono Coaching Award',
                        'body', 'Recognizes coaches whose volunteer Action Learning work delivers meaningful social impact.'
                    )
                )
            ),
            jsonb_build_object(
                'type', 'prose',
                'title', 'Nomination and eligibility rules',
                'paragraphs', jsonb_build_array(
                    'You can nominate a third party or put your own work forward — both routes use the same form, and every submission is acknowledged as soon as it arrives.'
                ),
                'bullets', jsonb_build_array(
                    'Past winners may not resubmit a previously awarded project or program.',
                    'Third-party nominees must consent to the nomination.',
                    'Individual awardees must hold a current WIAL coach certification.',
                    'Winners are asked to support WIAL''s publicity around the awards.',
                    'Decisions of the WIAL Awards Committee are final.'
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2024 award winners',
                'description', 'Presented at the WIAL Global Conference in Ho Chi Minh City, Vietnam.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Jeff Gold and Ollie Jones',
                        'subtitle', 'Marquardt Research Award · Winner',
                        'image', '/awards/winners/2024-jeff-gold-ollie-jones.jpg',
                        'imageAlt', 'Jeff Gold and Ollie Jones — Marquardt Research Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Athitkorn N. and Sumate Noklang, Srinakharinwirot University',
                        'subtitle', 'Marquardt Research Award · Runner-up',
                        'image', '/awards/winners/2024-athitkorn-sumate-noklang.jpg',
                        'imageAlt', 'Athitkorn N. and Sumate Noklang, Srinakharinwirot University — Marquardt Research Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Magali Lopes',
                        'subtitle', 'Marquardt Research Award · Runner-up',
                        'image', '/awards/winners/2024-magali-lopes.jpg',
                        'imageAlt', 'Magali Lopes — Marquardt Research Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Melbourne Business School, University of Melbourne',
                        'subtitle', 'Innovation Award · Winner',
                        'image', '/awards/winners/2024-melbourne-business-school.jpg',
                        'imageAlt', 'Melbourne Business School, University of Melbourne — Innovation Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Sumiko Watanabe, Tokyo Keizai University',
                        'subtitle', 'Innovation Award · Runner-up',
                        'image', '/awards/winners/2024-sumiko-watanabe.jpg',
                        'imageAlt', 'Sumiko Watanabe, Tokyo Keizai University — Innovation Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'May Han',
                        'subtitle', 'Coaching Excellence Award · Winner',
                        'image', '/awards/winners/2024-may-han.jpg',
                        'imageAlt', 'May Han — Coaching Excellence Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Shannon Banks, Be Leadership (UK)',
                        'subtitle', 'Coaching Excellence Award · Runner-up',
                        'image', '/awards/winners/2024-shannon-banks.jpg',
                        'imageAlt', 'Shannon Banks, Be Leadership (UK) — Coaching Excellence Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Peter Cauwelier and Peerawan Wattanametavong',
                        'subtitle', 'Coaching Excellence Award · Runner-up',
                        'image', '/awards/winners/2024-peter-cauwelier-peerawan.jpg',
                        'imageAlt', 'Peter Cauwelier and Peerawan Wattanametavong — Coaching Excellence Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Philips',
                        'subtitle', 'Application Award · Winner',
                        'image', '/awards/winners/2024-philips.jpg',
                        'imageAlt', 'Philips — Application Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Executive Breakthrough',
                        'subtitle', 'Application Award · Runner-up',
                        'image', '/awards/winners/2024-executive-breakthrough.jpg',
                        'imageAlt', 'Executive Breakthrough — Application Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Craig Filipkowski',
                        'subtitle', 'Pro Bono Coaching Award · Winner',
                        'image', '/awards/winners/2024-craig-filipkowski.jpg',
                        'imageAlt', 'Craig Filipkowski — Pro Bono Coaching Award · Winner'
                    )
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2023 award winners',
                'description', 'Presented during the virtual WIAL Global Action Learning Week.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Peerawan Wattanametavong (Thailand)',
                        'subtitle', 'Coaching Excellence Award · Winner',
                        'image', '/awards/winners/2023-peerawan-wattanametavong.webp',
                        'imageAlt', 'Peerawan Wattanametavong (Thailand) — Coaching Excellence Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Nguyen Duy Minh (Vietnam)',
                        'subtitle', 'Coaching Excellence Award · Runner-up',
                        'image', '/awards/winners/2023-nguyen-duy-minh.webp',
                        'imageAlt', 'Nguyen Duy Minh (Vietnam) — Coaching Excellence Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Mikinari Higano (Japan)',
                        'subtitle', 'Coaching Excellence Award · Runner-up',
                        'image', '/awards/winners/2023-mikinari-higano.webp',
                        'imageAlt', 'Mikinari Higano (Japan) — Coaching Excellence Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Entrepreneurship Club (Thailand)',
                        'subtitle', 'Innovation Award · Winner',
                        'image', '/awards/winners/2023-entrepreneurship-club.webp',
                        'imageAlt', 'Entrepreneurship Club (Thailand) — Innovation Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Chunghwa Telecom Training Institute (Taiwan)',
                        'subtitle', 'Innovation Award · Runner-up',
                        'image', '/awards/winners/2023-chunghwa-telecom.webp',
                        'imageAlt', 'Chunghwa Telecom Training Institute (Taiwan) — Innovation Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'DEK Technologies (Vietnam)',
                        'subtitle', 'Application Award · Winner',
                        'image', '/awards/winners/2023-dek-technologies.webp',
                        'imageAlt', 'DEK Technologies (Vietnam) — Application Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Wenshan Community College, Taipei (Taiwan)',
                        'subtitle', 'Application Award · Runner-up',
                        'image', '/awards/winners/2023-wenshan-community-college.webp',
                        'imageAlt', 'Wenshan Community College, Taipei (Taiwan) — Application Award · Runner-up'
                    )
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2022 award winners',
                'description', 'Presented during the virtual WIAL Global Action Learning Week.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Entrepreneurship Club and Bean Sprout Team (Thailand)',
                        'subtitle', 'Pro Bono Coaching Award · Winner',
                        'image', '/awards/winners/2022-entrepreneurship-club-bean-sprout.webp',
                        'imageAlt', 'Entrepreneurship Club and Bean Sprout Team (Thailand) — Pro Bono Coaching Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Shaohua Hou and Zhu Yongquan (China)',
                        'subtitle', 'Application Award · Winners',
                        'image', '/awards/winners/2022-shaohua-hou-zhu-yongquan.webp',
                        'imageAlt', 'Shaohua Hou and Zhu Yongquan (China) — Application Award · Winners'
                    ),
                    jsonb_build_object(
                        'title', 'Maura Muller (USA)',
                        'subtitle', 'Application Award · Runner-up',
                        'image', '/awards/winners/2022-maura-muller.webp',
                        'imageAlt', 'Maura Muller (USA) — Application Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Yayoi Hirose (Japan)',
                        'subtitle', 'Marquardt Research Award · Winner',
                        'image', '/awards/winners/2022-yayoi-hirose.webp',
                        'imageAlt', 'Yayoi Hirose (Japan) — Marquardt Research Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'William Teo (Malaysia)',
                        'subtitle', 'Coaching Excellence Award · Winner',
                        'image', '/awards/winners/2022-william-teo.webp',
                        'imageAlt', 'William Teo (Malaysia) — Coaching Excellence Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Craig Filipkowski',
                        'image', '/awards/winners/2022-craig-filipkowski.webp',
                        'imageAlt', 'Craig Filipkowski — WIAL award winner'
                    ),
                    jsonb_build_object(
                        'title', 'WIAL Vietnam',
                        'subtitle', 'Affiliate of the Year · Winner',
                        'image', '/awards/winners/2022-wial-vietnam.webp',
                        'imageAlt', 'WIAL Vietnam — Affiliate of the Year · Winner'
                    )
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2021 award winners',
                'description', 'Presented at the WIAL Global Virtual Conference.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Seung-Hee Park, Dr. Yoojoo Cho, and Dr. Hyeon-Cheol Bong',
                        'subtitle', 'Marquardt Research Award · Winners',
                        'image', '/awards/winners/2021-park-cho-bong.webp',
                        'imageAlt', 'Seung-Hee Park, Dr. Yoojoo Cho, and Dr. Hyeon-Cheol Bong — Marquardt Research Award · Winners'
                    ),
                    jsonb_build_object(
                        'title', 'Magali Lopes',
                        'subtitle', 'Marquardt Research Award · Runner-up',
                        'image', '/awards/winners/2021-magali-lopes.webp',
                        'imageAlt', 'Magali Lopes — Marquardt Research Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Hawar Amin',
                        'subtitle', 'Coaching Excellence Award · Winner',
                        'image', '/awards/winners/2021-hawar-amin.webp',
                        'imageAlt', 'Hawar Amin — Coaching Excellence Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Maria Angela Passador and Sumaia Thomas',
                        'subtitle', 'Pro Bono Coaching Award · Winners',
                        'image', '/awards/winners/2021-passador-thomas.webp',
                        'imageAlt', 'Maria Angela Passador and Sumaia Thomas — Pro Bono Coaching Award · Winners'
                    ),
                    jsonb_build_object(
                        'title', 'Kok Hua Phoon',
                        'subtitle', 'Pro Bono Coaching Award · Runner-up',
                        'image', '/awards/winners/2021-kok-hua-phoon.webp',
                        'imageAlt', 'Kok Hua Phoon — Pro Bono Coaching Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'Emerging World',
                        'subtitle', 'Innovation Award · Winner',
                        'image', '/awards/winners/2021-emerging-world.webp',
                        'imageAlt', 'Emerging World — Innovation Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'Takeda',
                        'subtitle', 'Innovation Award · Runner-up',
                        'image', '/awards/winners/2021-takeda.webp',
                        'imageAlt', 'Takeda — Innovation Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'JSR BST Elastomer Co., Ltd.',
                        'subtitle', 'Application Award · Winner',
                        'image', '/awards/winners/2021-jsr-bst-elastomer.webp',
                        'imageAlt', 'JSR BST Elastomer Co., Ltd. — Application Award · Winner'
                    ),
                    jsonb_build_object(
                        'title', 'TNP Group',
                        'subtitle', 'Application Award · Runner-up',
                        'image', '/awards/winners/2021-tnp-group.webp',
                        'imageAlt', 'TNP Group — Application Award · Runner-up'
                    ),
                    jsonb_build_object(
                        'title', 'WIAL Singapore',
                        'subtitle', 'Affiliate of the Year · Winner',
                        'image', '/awards/winners/2021-wial-singapore.webp',
                        'imageAlt', 'WIAL Singapore — Affiliate of the Year · Winner'
                    )
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2019 award winners',
                'description', 'Presented at the WIAL Global Conference in São Paulo, Brazil.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Yanfeng Automotive Interiors',
                        'subtitle', 'Innovation Award',
                        'image', '/awards/winners/2019-yanfeng.webp',
                        'imageAlt', 'Yanfeng Automotive Interiors — Innovation Award'
                    ),
                    jsonb_build_object(
                        'title', 'Satellite Applications Catapult (UK)',
                        'subtitle', 'Application Award',
                        'image', '/awards/winners/2019-catapult.png',
                        'imageAlt', 'Satellite Applications Catapult (UK) — Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'BNP Paribas',
                        'subtitle', 'Application Award',
                        'image', '/awards/winners/2019-bnp-paribas.webp',
                        'imageAlt', 'BNP Paribas — Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'ThoughtWorks',
                        'subtitle', 'Application Award',
                        'image', '/awards/winners/2019-thoughtworks.webp',
                        'imageAlt', 'ThoughtWorks — Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Haier',
                        'subtitle', 'Application Award',
                        'image', '/awards/winners/2019-haier.png',
                        'imageAlt', 'Haier — Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Lyreco',
                        'subtitle', 'Application Award',
                        'image', '/awards/winners/2019-lyreco.webp',
                        'imageAlt', 'Lyreco — Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Magali Lopes',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2019-magali-lopes.jpg',
                        'imageAlt', 'Magali Lopes — Coaching Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Bill Thimmesch',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2019-bill-thimmesch.jpg',
                        'imageAlt', 'Bill Thimmesch — Coaching Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Dr. Peter Cauwelier',
                        'subtitle', 'Marquardt Research Award',
                        'image', '/awards/winners/2019-peter-cauwelier.jpg',
                        'imageAlt', 'Dr. Peter Cauwelier — Marquardt Research Award'
                    ),
                    jsonb_build_object('title', 'WIAL USA', 'subtitle', 'Affiliate of the Year')
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2018 award winners',
                'description', 'Presented at the WIAL Global Conference in Amersfoort, The Netherlands.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Thermo Fisher Scientific',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2018-thermo-fisher.webp',
                        'imageAlt', 'Thermo Fisher Scientific — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Takeda',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2018-takeda.jpg',
                        'imageAlt', 'Takeda — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'The New York Public Library',
                        'subtitle', 'Innovation Award',
                        'image', '/awards/winners/2018-nypl.png',
                        'imageAlt', 'The New York Public Library — Innovation Award'
                    ),
                    jsonb_build_object(
                        'title', 'Tabor College d''Ampte',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2018-tabor-college.jpg',
                        'imageAlt', 'Tabor College d''Ampte — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'China Foreign Economy and Trade Trust (FOTIC)',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2018-fotic.png',
                        'imageAlt', 'China Foreign Economy and Trade Trust (FOTIC) — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'WIAL Brasil',
                        'subtitle', 'Pro Bono Award',
                        'image', '/awards/winners/2018-wial-brasil-pro-bono.jpg',
                        'imageAlt', 'WIAL Brasil — Pro Bono Award'
                    ),
                    jsonb_build_object(
                        'title', 'Mies de Koning',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2018-mies-de-koning.png',
                        'imageAlt', 'Mies de Koning — Coaching Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Sridar Ramachandran',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2018-sridar-ramachandran.png',
                        'imageAlt', 'Sridar Ramachandran — Coaching Excellence Award'
                    ),
                    jsonb_build_object('title', 'WIAL Netherlands', 'subtitle', 'Affiliate of the Year'),
                    jsonb_build_object('title', 'WIAL Brasil', 'subtitle', 'Affiliate of the Year')
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2017 award winners',
                'description', 'Presented at the WIAL Global Conference in Shanghai, China.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Hitachi Information & Telecommunication',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-hitachi.png',
                        'imageAlt', 'Hitachi Information & Telecommunication — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Panyapiwat Institute of Management',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-panyapiwat.png',
                        'imageAlt', 'Panyapiwat Institute of Management — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Primary School Helmgras',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-helmgras.jpg',
                        'imageAlt', 'Primary School Helmgras — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'The Chopras',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-the-chopras.png',
                        'imageAlt', 'The Chopras — Best Application Award'
                    ),
                    jsonb_build_object('title', 'The New York Public Library', 'subtitle', 'Best Application Award'),
                    jsonb_build_object(
                        'title', 'Eastern Caribbean Central Bank',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-eccb.png',
                        'imageAlt', 'Eastern Caribbean Central Bank — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'AVIVA-COFCO Life Insurance',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-aviva-cofco.jpg',
                        'imageAlt', 'AVIVA-COFCO Life Insurance — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Changan Ford',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-changan-ford.png',
                        'imageAlt', 'Changan Ford — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Robinsons Land Corporation',
                        'subtitle', 'Best Application Award',
                        'image', '/awards/winners/2017-robinsons-land.png',
                        'imageAlt', 'Robinsons Land Corporation — Best Application Award'
                    ),
                    jsonb_build_object(
                        'title', 'Marina Mazi',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2017-marina-mazi.png',
                        'imageAlt', 'Marina Mazi — Coaching Excellence Award'
                    ),
                    jsonb_build_object('title', 'Tiffany Maurycy', 'subtitle', 'Pro Bono Award'),
                    jsonb_build_object(
                        'title', 'Ed Williams',
                        'subtitle', 'Pro Bono Award',
                        'image', '/awards/winners/2017-ed-williams.png',
                        'imageAlt', 'Ed Williams — Pro Bono Award'
                    ),
                    jsonb_build_object('title', 'WIAL Malaysia', 'subtitle', 'Affiliate of the Year')
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2016 award winners',
                'description', 'Presented at the WIAL Global Conference in Warsaw, Poland.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Matthew Farmer',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2016-matthew-farmer.png',
                        'imageAlt', 'Matthew Farmer — Coaching Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Tomasz Janiak',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2016-tomasz-janiak.jpg',
                        'imageAlt', 'Tomasz Janiak — Coaching Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Twan Paes',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2016-twan-paes.png',
                        'imageAlt', 'Twan Paes — Coaching Excellence Award'
                    ),
                    jsonb_build_object('title', 'Ming Yen Yang', 'subtitle', 'Coaching Excellence Award'),
                    jsonb_build_object(
                        'title', 'Christopher Tan',
                        'subtitle', 'Leadership Excellence Award',
                        'image', '/awards/winners/2016-christopher-tan.png',
                        'imageAlt', 'Christopher Tan — Leadership Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Louis Baron',
                        'subtitle', 'Research Excellence Award',
                        'image', '/awards/winners/2016-louis-baron.jpg',
                        'imageAlt', 'Louis Baron — Research Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Simon Reese',
                        'subtitle', 'Research Excellence Award',
                        'image', '/awards/winners/2016-simon-reese.jpg',
                        'imageAlt', 'Simon Reese — Research Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Mary Volz-Peacock, Bea Carson, and Michael Marquardt',
                        'subtitle', 'Research Excellence Award',
                        'image', '/awards/winners/2016-volz-peacock-carson-marquardt.jpg',
                        'imageAlt', 'Mary Volz-Peacock, Bea Carson, and Michael Marquardt — Research Excellence Award'
                    ),
                    jsonb_build_object('title', 'MSI', 'subtitle', 'Best Application in Business'),
                    jsonb_build_object('title', 'China Southern Airlines', 'subtitle', 'Best Application in Business'),
                    jsonb_build_object('title', 'WIAL Caribbean', 'subtitle', 'Affiliate of the Year'),
                    jsonb_build_object('title', 'WIAL Poland', 'subtitle', 'Affiliate of the Year')
                )
            ),
            jsonb_build_object(
                'type', 'gallery_grid',
                'title', '2015 award winners',
                'description', 'Organization and individual honors across the global Action Learning community.',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'title', 'Ross School of Business, University of Michigan',
                        'subtitle', 'Action Learning Excellence · Academic Institute',
                        'image', '/awards/winners/2015-michigan-ross.png',
                        'imageAlt', 'Ross School of Business, University of Michigan — Action Learning Excellence · Academic Institute'
                    ),
                    jsonb_build_object(
                        'title', 'Transition Optical Philippines',
                        'subtitle', 'Action Learning Excellence · Small-Medium Organization',
                        'image', '/awards/winners/2015-transition-optical.png',
                        'imageAlt', 'Transition Optical Philippines — Action Learning Excellence · Small-Medium Organization'
                    ),
                    jsonb_build_object(
                        'title', 'Canon',
                        'subtitle', 'Action Learning Excellence · Small-Medium Organization',
                        'image', '/awards/winners/2015-canon.png',
                        'imageAlt', 'Canon — Action Learning Excellence · Small-Medium Organization'
                    ),
                    jsonb_build_object(
                        'title', 'Air Asia',
                        'subtitle', 'Action Learning Excellence · Large Organization',
                        'image', '/awards/winners/2015-air-asia.png',
                        'imageAlt', 'Air Asia — Action Learning Excellence · Large Organization'
                    ),
                    jsonb_build_object(
                        'title', 'Nanshan Group',
                        'subtitle', 'Action Learning Excellence · Conglomerate',
                        'image', '/awards/winners/2015-nanshan-group.png',
                        'imageAlt', 'Nanshan Group — Action Learning Excellence · Conglomerate'
                    ),
                    jsonb_build_object(
                        'title', 'Caribbean Leadership Program',
                        'subtitle', 'Action Learning Excellence · Government',
                        'image', '/awards/winners/2015-caribbean-leadership.png',
                        'imageAlt', 'Caribbean Leadership Program — Action Learning Excellence · Government'
                    ),
                    jsonb_build_object(
                        'title', 'Association for Talent Development',
                        'subtitle', 'Action Learning Excellence · Association',
                        'image', '/awards/winners/2015-atd.png',
                        'imageAlt', 'Association for Talent Development — Action Learning Excellence · Association'
                    ),
                    jsonb_build_object(
                        'title', 'Emergenetics International Asia Pacific',
                        'subtitle', 'Action Learning Innovation Award',
                        'image', '/awards/winners/2015-emergenetics.png',
                        'imageAlt', 'Emergenetics International Asia Pacific — Action Learning Innovation Award'
                    ),
                    jsonb_build_object('title', 'Ming Yen Yang', 'subtitle', 'Global Leader in Action Learning'),
                    jsonb_build_object(
                        'title', 'Manish Jain',
                        'subtitle', 'Leadership Excellence Award',
                        'image', '/awards/winners/2015-manish-jain.jpg',
                        'imageAlt', 'Manish Jain — Leadership Excellence Award'
                    ),
                    jsonb_build_object('title', 'Joe CM Lee', 'subtitle', 'Research Excellence Award'),
                    jsonb_build_object(
                        'title', 'Skip Leonard',
                        'subtitle', 'Research Excellence Award',
                        'image', '/awards/winners/2015-skip-leonard.jpg',
                        'imageAlt', 'Skip Leonard — Research Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Arthur Freedman',
                        'subtitle', 'Research Excellence Award',
                        'image', '/awards/winners/2015-arthur-freedman.png',
                        'imageAlt', 'Arthur Freedman — Research Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Phoon Kok Hwa',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2015-phoon-kok-hwa.png',
                        'imageAlt', 'Phoon Kok Hwa — Coaching Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Emily Rogers',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2015-emily-rogers.png',
                        'imageAlt', 'Emily Rogers — Coaching Excellence Award'
                    ),
                    jsonb_build_object(
                        'title', 'Faz Kamariddin',
                        'subtitle', 'Coaching Excellence Award',
                        'image', '/awards/winners/2015-faz-kamariddin.png',
                        'imageAlt', 'Faz Kamariddin — Coaching Excellence Award'
                    ),
                    jsonb_build_object('title', 'WIAL Singapore', 'subtitle', 'Affiliate of the Year')
                )
            ),
            jsonb_build_object(
                'type', 'logo_grid',
                'title', 'Earlier organization award winners',
                'items', jsonb_build_array(
                    jsonb_build_object('name', 'Microsoft', 'logo', '/awards/winners/legacy-microsoft.png'),
                    jsonb_build_object('name', 'Sony', 'logo', '/awards/winners/legacy-sony.png'),
                    jsonb_build_object('name', 'Panasonic', 'logo', '/awards/winners/legacy-panasonic.png'),
                    jsonb_build_object('name', 'NEC', 'logo', '/awards/winners/legacy-nec.png'),
                    jsonb_build_object('name', 'Nomura', 'logo', '/awards/winners/legacy-nomura.png'),
                    jsonb_build_object('name', 'Kirin', 'logo', '/awards/winners/legacy-kirin.png'),
                    jsonb_build_object('name', 'Lexus', 'logo', '/awards/winners/legacy-lexus.png'),
                    jsonb_build_object('name', 'Target', 'logo', '/awards/winners/legacy-target.png'),
                    jsonb_build_object('name', 'Wells Fargo', 'logo', '/awards/winners/legacy-wells-fargo.png'),
                    jsonb_build_object('name', 'Constellation Energy', 'logo', '/awards/winners/legacy-constellation.png'),
                    jsonb_build_object('name', 'Boehringer Ingelheim', 'logo', '/awards/winners/legacy-boehringer.png'),
                    jsonb_build_object('name', 'Fuji Xerox', 'logo', '/awards/winners/legacy-fuji-xerox.png'),
                    jsonb_build_object('name', 'Goodwill', 'logo', '/awards/winners/legacy-goodwill.png'),
                    jsonb_build_object('name', 'Infinitus', 'logo', '/awards/winners/legacy-infinitus.png'),
                    jsonb_build_object('name', 'Rohde & Schwarz', 'logo', '/awards/winners/legacy-rohde-schwarz.png'),
                    jsonb_build_object('name', 'Federal Aviation Administration', 'logo', '/awards/winners/legacy-faa.png'),
                    jsonb_build_object('name', 'AXA', 'logo', '/awards/winners/legacy-axa.png'),
                    jsonb_build_object('name', 'Rikkyo University', 'logo', '/awards/winners/legacy-rikkyo.png'),
                    jsonb_build_object('name', 'American University', 'logo', '/awards/winners/legacy-american-university.png')
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Apply or nominate today',
                'body', 'Nominate an organization or individual whose Action Learning work deserves recognition — or put your own work forward. Every submission is acknowledged as soon as it arrives.',
                'href', '/awards/nomination',
                'label', 'Open the nomination form'
            )
        )
    ),
    jsonb_build_object(
        'description', 'WIAL''s annual awards recognize individuals and organizations demonstrating excellence in Action Learning — five award categories, past winners since 2015, and how to nominate.',
        'sourceUrl', 'https://wial.org/awards/',
        'sourceStatus', 'migrated-from-wial',
        'sourceNotes', 'Consolidates wial.org/awards, /award-nomination (criteria and eligibility kept; the nomination form itself is migrated to the internal /awards/nomination route, stored in award_nominations), and /previous-wial-award-winners (per-year gallery_grid sections with winner slides, photos, and logos vendored under public/awards/winners/; 2021-2024 names and awards transcribed from the slide images themselves since the source captions were garbled; generic WIAL-logo placeholder images and two mismatched logos from the source were dropped rather than republished). Ceremony photo vendored under public/awards/.'
    ),
    now(),
    now()
)
on conflict (slug) where chapter_id is null
do update set
    title = excluded.title,
    published = excluded.published,
    body_richtext = excluded.body_richtext,
    seo = excluded.seo,
    updated_at = now();
