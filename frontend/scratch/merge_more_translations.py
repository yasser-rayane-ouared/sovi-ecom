# -*- coding: utf-8 -*-
import os

more_ar_keys = {
    "adminReceiptsApproveError": "فشل إرسال طلب الموافقة.",
    "adminReceiptsDeclineReasonRequired": "يرجى توضيح سبب الرفض في الملاحظات أولاً.",
    "adminReceiptsDeclineError": "فشل إرسال طلب الرفض.",
    "billingReceiptSubmitErrorPlan": "يرجى اختيار خطة الاشتراك",
    "billingReceiptSubmitErrorReceipt": "يرجى إرفاق صورة إيصال الدفع",
    "billingReceiptSubmitErrorAmount": "يرجى إدخال مبلغ صحيح",
    "billingLimitsFeaturesTitle": "الميزات المدعومة",
    "billingLimitsNoActiveSubPrompt": "يرجى تفعيل اشتراك أولاً لعرض حدود الاستهلاك والميزات المتاحة.",
    "settingsTabTitle": "أقسام الإعدادات",
}

more_en_keys = {
    "adminReceiptsApproveError": "Failed to send approval request.",
    "adminReceiptsDeclineReasonRequired": "Please explain the reason for decline in notes first.",
    "adminReceiptsDeclineError": "Failed to send decline request.",
    "billingReceiptSubmitErrorPlan": "Please select a subscription plan",
    "billingReceiptSubmitErrorReceipt": "Please attach the payment receipt image",
    "billingReceiptSubmitErrorAmount": "Please enter a valid amount",
    "billingLimitsFeaturesTitle": "Supported Features",
    "billingLimitsNoActiveSubPrompt": "Please activate a subscription first to view usage limits and available features.",
    "settingsTabTitle": "Settings Sections",
}

more_fr_keys = {
    "adminReceiptsApproveError": "Échec de l'envoi de la demande d'approbation.",
    "adminReceiptsDeclineReasonRequired": "Veuillez expliquer la raison du refus dans les notes d'abord.",
    "adminReceiptsDeclineError": "Échec de l'envoi de la demande de refus.",
    "billingReceiptSubmitErrorPlan": "Veuillez choisir un plan d'abonnement",
    "billingReceiptSubmitErrorReceipt": "Veuillez joindre l'image du reçu de paiement",
    "billingReceiptSubmitErrorAmount": "Veuillez saisir un montant valide",
    "billingLimitsFeaturesTitle": "Fonctionnalités supportées",
    "billingLimitsNoActiveSubPrompt": "Veuillez d'abord activer un abonnement pour afficher les limites d'utilisation et les fonctionnalités disponibles.",
    "settingsTabTitle": "Sections des paramètres",
}

def format_block(keys_dict):
    out = []
    for k, v in keys_dict.items():
        val_esc = v.replace('"', '\\"')
        out.append(f'    {k}: "{val_esc}",')
    return "\n".join(out) + "\n"

def main():
    file_path = r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\src\lib\translations.ts"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # We can insert these at the end of our previous blocks, i.e., before adminAccountsToggleError: "...",
    # ar block: adminAccountsToggleError: "فشل إيقاف/تنشيط المتجر.",
    ar_pattern = '    adminAccountsToggleError: "فشل إيقاف/تنشيط المتجر.",'
    if ar_pattern not in content:
        print("Arabic anchor not found.")
        return
    ar_replacement = format_block(more_ar_keys) + ar_pattern
    content = content.replace(ar_pattern, ar_replacement)

    # en block: adminAccountsToggleError: "Failed to suspend/activate store.",
    en_pattern = '    adminAccountsToggleError: "Failed to suspend/activate store.",'
    en_replacement = format_block(more_en_keys) + en_pattern
    content = content.replace(en_pattern, en_replacement)

    # fr block: adminAccountsToggleError: "Échec de la suspension/activation.",
    fr_pattern = '    adminAccountsToggleError: "Échec de la suspension/activation.",'
    fr_replacement = format_block(more_fr_keys) + fr_pattern
    content = content.replace(fr_pattern, fr_replacement)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("More translations merged successfully!")

if __name__ == "__main__":
    main()
