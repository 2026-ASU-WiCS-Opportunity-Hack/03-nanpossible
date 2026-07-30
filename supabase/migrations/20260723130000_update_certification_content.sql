-- ============================================================
-- Migration: Update Certification Page Content
-- Date: 2025-07-15
-- Description: Remove badges, Credly references, and downloadable forms
-- ============================================================

update public.content_pages
set
    body_richtext = jsonb_build_object(
        'heroIntro', 'WIAL offers four levels of certification for Action Learning coaches. Each level represents increasing expertise, experience, and leadership in the Action Learning community.',
        'metrics', jsonb_build_array(
            jsonb_build_object('label', 'Certification levels', 'value', '4'),
            jsonb_build_object('label', 'ICF accredited', 'value', 'CCE'),
            jsonb_build_object('label', 'Global recognition', 'value', 'Yes')
        ),
        'sections', jsonb_build_array(
            jsonb_build_object(
                'type', 'prose',
                'title', 'Why Get Certified',
                'paragraphs', jsonb_build_array(
                    'A trained Action Learning coach is a key success factor for Action Learning programs. Professionals can enhance their value through WIAL certification, which is recognized globally.',
                    'WIAL is an ICF-accredited training provider, and our CALC certification is an accredited ICF CCE program.'
                )
            ),
            jsonb_build_object(
                'type', 'feature_grid',
                'title', 'Four Levels of Certification',
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'eyebrow', 'CALC',
                        'title', 'Certified Action Learning Coach',
                        'body', 'CALCs can coach Action Learning sessions and form the first formal certification step in the WIAL model.'
                    ),
                    jsonb_build_object(
                        'eyebrow', 'PALC',
                        'title', 'Professional Action Learning Coach',
                        'body', 'PALCs are coaches who have proven their ability and have accumulated meaningful WIAL Action Learning experience.'
                    ),
                    jsonb_build_object(
                        'eyebrow', 'SALC',
                        'title', 'Senior Action Learning Coach',
                        'body', 'SALCs are cleared to lead all WIAL programs and represent a higher level of experience and readiness.'
                    ),
                    jsonb_build_object(
                        'eyebrow', 'MALC',
                        'title', 'Master Action Learning Coach',
                        'body', 'MALCs are thought leaders in the Action Learning community and represent the highest level in the WIAL hierarchy.'
                    )
                )
            ),
            jsonb_build_object(
                'type', 'cta',
                'title', 'Ready to Get Certified?',
                'body', 'Contact us to learn more about WIAL certification programs and find a certification path that''s right for you.',
                'href', '/contact',
                'label', 'Contact Us'
            )
        )
    ),
    seo = jsonb_build_object(
        'description', 'WIAL certification programs - CALC, PALC, SALC, and MALC certification for Action Learning coaches.',
        'sourceUrl', 'https://wial.org/certification/',
        'sourceStatus', 'updated',
        'sourceNotes', 'Updated: Removed digital badges, Credly references, and downloadable forms. Kept certification levels and ICF accreditation.'
    ),
    updated_at = now()
where slug = 'certification';