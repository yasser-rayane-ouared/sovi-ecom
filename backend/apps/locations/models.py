"""
Models for Algeria administrative divisions.
Wilayas (provinces) and Communes (municipalities).
"""
from django.db import models


class Wilaya(models.Model):
    """
    Represents one of Algeria's 58 administrative provinces (wilayas).
    The `code` matches the official Algerian wilaya numbering (1–58).
    """
    code = models.PositiveSmallIntegerField(
        unique=True,
        db_index=True,
        help_text="Official Algerian wilaya number (1-58)",
    )
    name = models.CharField(max_length=100, db_index=True)

    class Meta:
        db_table = 'locations_wilaya'
        ordering = ['code']
        verbose_name = 'Wilaya'
        verbose_name_plural = 'Wilayas'
        indexes = [
            models.Index(fields=['code'], name='wilaya_code_idx'),
            models.Index(fields=['name'], name='wilaya_name_idx'),
        ]

    def __str__(self):
        return f"{self.code:02d} - {self.name}"


class Commune(models.Model):
    """
    Represents an Algerian commune (municipality), linked to its parent wilaya.
    """
    wilaya = models.ForeignKey(
        Wilaya,
        on_delete=models.CASCADE,
        related_name='communes',
        db_index=True,
    )
    name = models.CharField(max_length=150, db_index=True)

    class Meta:
        db_table = 'locations_commune'
        ordering = ['wilaya__code', 'name']
        verbose_name = 'Commune'
        verbose_name_plural = 'Communes'
        unique_together = [('wilaya', 'name')]
        indexes = [
            models.Index(fields=['wilaya', 'name'], name='commune_wilaya_name_idx'),
            models.Index(fields=['name'], name='commune_name_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.wilaya.name})"
