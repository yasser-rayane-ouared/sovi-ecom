"""Delivery company constants shared across apps.

Keep this module free of heavy imports (no models, views, serializers)
to avoid circular import issues.
"""

YALIDINE_COMPANIES = {
    'yalidine', 'gupex', 'guepex', 'yalitec', 'yaliteck'
}

ECOTRACK_COMPANIES = {
    # Legacy/aliases
    'noest', 'ecolog', 'dhd',
    # 41 EcoTrack Partners
    '48hr_livraison', 'allo_livraison', 'anderson_delivery', 'areex', 'assil_delivery', 'baconsult',
    'colireli', 'colivraison_express', 'coyote_express', 'delivromail', 'dhd_express', 'distazero',
    'expedia_chrono', 'fretdirect', 'fz_delivery', 'golivri', 'hhd_express', 'imir', 'medexpress',
    'monohub', 'msm_go', 'navex_delivery', 'negmar_express', 'noest_express', 'om_express',
    'ontime_ecotrack', 'packers', 'pdex', 'prest', 'rb_livraison', 'rex_livraison', 'rocket_delivery',
    'salva_delivery', 'samex_delivery', 'speed_delivery', 'swift_express', 'tsl_express',
    'ultra_express', 'univer_delivery', 'worldexpress', 'zvit_express',
}
