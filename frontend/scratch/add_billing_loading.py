# -*- coding: utf-8 -*-
import os

def main():
    file_path = r"c:\Users\LENOVO\OneDrive\Desktop\s\frontend\src\lib\translations.ts"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # ar block
    ar_pattern = '    billingStatusTitle: "حالة الاشتراك",'
    ar_replacement = '    billingLoadingTitle: "جاري تحميل لوحة الفواتير والاشتراكات...",\n' + ar_pattern
    content = content.replace(ar_pattern, ar_replacement)

    # en block
    en_pattern = '    billingStatusTitle: "Subscription Status",'
    en_replacement = '    billingLoadingTitle: "Loading billing and subscriptions panel...",\n' + en_pattern
    content = content.replace(en_pattern, en_replacement)

    # fr block
    fr_pattern = '    billingStatusTitle: "Statut de l\'abonnement",'
    fr_replacement = '    billingLoadingTitle: "Chargement du panneau de facturation et d\'abonnements...",\n' + fr_pattern
    content = content.replace(fr_pattern, fr_replacement)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Added billingLoadingTitle key successfully!")

if __name__ == "__main__":
    main()
