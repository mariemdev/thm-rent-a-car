import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      nav: {
        dashboard: 'Tableau de bord',
        cars: 'Véhicules',
        branches: 'Locaux',
        rentals: 'Locations',
        invoices: 'Factures',
        users: 'Utilisateurs',
        logout: 'Déconnexion',
        login: 'Connexion',
        group_general: 'Général',
        group_operations: 'Opérations',
        group_fleet: 'Véhicules & Parc',
        group_contacts: 'Clients & Personnel',
        group_system: 'Configuration'
      },
      dashboard: {
        title: 'Tableau de bord',
        income: 'Revenu total',
        activeRentals: 'Locations actives',
        availableCars: 'Véhicules disponibles',
        rentalsPerMonth: 'Locations par mois',
        recentRentals: 'Locations récentes',
        upcomingReturns: 'Retours à venir',
        totalClients: 'Total Clients'
      },
      cars: {
        title: 'Gestion des véhicules',
        add: 'Ajouter un véhicule',
        brand: 'Marque',
        model: 'Modèle',
        registration: 'Immatriculation',
        price: 'Prix journalier',
        location: 'Emplacement',
        chooseBrand: 'Choisir une marque',
        otherBrand: 'Autre marque...',
        mileage: 'Kilométrage',
        oilChange: 'Prochaine vidange (km)',
        technicalInspection: 'Date visite technique',
        status: 'Statut',
        available: 'Disponible',
        rented: 'Loué',
        maintenance: 'Maintenance',
        actions: 'Actions',
        edit: 'Modifier',
        delete: 'Supprimer',
        images: 'Images'
      },
      rentals: {
        title: 'Gestion des locations',
        new: 'Nouvelle location',
        customer: 'Client',
        phone: 'Téléphone',
        idNumber: 'Numéro d\'identité',
        startDate: 'Date de début',
        endDate: 'Date de fin',
        totalPrice: 'Prix total',
        validate: 'Valider la location',
        contract: 'Contrat',
        generatePdf: 'Générer le contrat PDF',
        statePhotos: 'Photos de l\'état du véhicule (5 requises)',
        uploadPhotos: 'Télécharger les photos'
      },
      invoices: {
        title: 'Gestion des factures',
        selectClient: 'Sélectionner un client',
        searchPlaceholder: 'CIN, Nom, Raison Sociale, Téléphone...',
        generate: 'Générer la facture',
        noRentals: 'Aucune location trouvée pour ce client',
        selectedRentals: 'Locations sélectionnées',
        clientType: 'Type de client',
        individual: 'Particulier',
        company: 'Société'
      },
      customers: {
        title: 'Gestion des clients',
        add: 'Nouveau client',
        name: 'Nom',
        firstName: 'Prénom',
        type: 'Type',
        individual: 'Particulier',
        company: 'Société',
        nationality: 'Nationalité',
        city: 'Ville',
        country: 'Pays',
        history: 'Historique des locations'
      },
      common: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        search: 'Rechercher',
        loading: 'Chargement...',
        error: 'Une erreur est survenue',
        success: 'Opération réussie'
      },
      pagination: {
        rowsPerPage: 'Lignes par page',
        of: 'sur',
        pageOf: 'Page {{current}} sur {{total}}',
        displayRows: 'Affichage de {{from}} à {{to}} sur {{total}} lignes',
        next: 'Suivant',
        previous: 'Précédent',
        first: 'Première page',
        last: 'Dernière page'
      }
    }
  },
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        cars: 'Vehicles',
        agencies: 'Agencies',
        branches: 'Branches',
        rentals: 'Rentals',
        invoices: 'Invoices',
        users: 'Users',
        logout: 'Logout',
        login: 'Login',
        group_general: 'General',
        group_operations: 'Operations',
        group_fleet: 'Fleet & Branches',
        group_contacts: 'Contacts & Staff',
        group_system: 'System'
      },
      dashboard: {
        title: 'Dashboard',
        income: 'Total Income',
        activeRentals: 'Active Rentals',
        availableCars: 'Available Vehicles',
        rentalsPerMonth: 'Rentals per Month',
        recentRentals: 'Recent Rentals',
        upcomingReturns: 'Upcoming Returns'
      },
      cars: {
        title: 'Vehicle Management',
        add: 'Add Vehicle',
        brand: 'Brand',
        model: 'Model',
        registration: 'Registration',
        price: 'Daily Price',
        mileage: 'Mileage',
        status: 'Status',
        available: 'Available',
        rented: 'Rented',
        maintenance: 'Maintenance',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        images: 'Images'
      },
      rentals: {
        title: 'Rental Management',
        new: 'New Rental',
        customer: 'Customer',
        phone: 'Phone',
        idNumber: 'ID Number',
        startDate: 'Start Date',
        endDate: 'End Date',
        totalPrice: 'Total Price',
        validate: 'Validate Rental',
        contract: 'Contract',
        generatePdf: 'Generate PDF Contract',
        statePhotos: 'Car State Photos (5 required)',
        uploadPhotos: 'Upload Photos'
      },
      invoices: {
        title: 'Invoice Management',
        selectClient: 'Select a Client',
        searchPlaceholder: 'ID Number, Name, Company Name, Phone...',
        generate: 'Generate Invoice',
        noRentals: 'No rentals found for this client',
        selectedRentals: 'Selected Rentals',
        clientType: 'Client Type',
        individual: 'Individual',
        company: 'Company'
      },
      customers: {
        title: 'Customer Management',
        add: 'New Customer',
        name: 'Last Name',
        firstName: 'First Name',
        type: 'Type',
        individual: 'Individual',
        company: 'Company',
        nationality: 'Nationality',
        city: 'City',
        country: 'Country',
        history: 'Rental History'
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        search: 'Search',
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Operation successful'
      },
      pagination: {
        rowsPerPage: 'Rows per page',
        of: 'of',
        pageOf: 'Page {{current}} of {{total}}',
        displayRows: 'Showing {{from}} to {{to}} of {{total}} rows',
        next: 'Next',
        previous: 'Previous',
        first: 'First page',
        last: 'Last page'
      }
    }
  },
  ar: {
    translation: {
      nav: {
        dashboard: 'لوحة القيادة',
        cars: 'السيارات',
        agencies: 'الوكالات',
        branches: 'الفروع',
        rentals: 'الإيجارات',
        invoices: 'الفواتير',
        customers: 'العملاء',
        drivers: 'السائقين',
        users: 'المستخدمين',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        login: 'تسجيل الدخول',
        group_general: 'عام',
        group_operations: 'العمليات',
        group_fleet: 'الأسطول والفروع',
        group_contacts: 'العملاء والموظفين',
        group_system: 'النظام'
      },
      dashboard: {
        title: 'لوحة القيادة',
        income: 'إجمالي الدخل',
        activeRentals: 'الإيجارات النشطة',
        availableCars: 'السيارات المتاحة',
        rentalsPerMonth: 'الإيجارات شهرياً',
        recentRentals: 'الإيجارات الأخيرة',
        upcomingReturns: 'العودة القادمة',
        totalClients: 'إجمالي العملاء'
      },
      cars: {
        title: 'إدارة السيارات',
        add: 'إضافة سيارة',
        brand: 'العلامة التجارية',
        model: 'الموديل',
        registration: 'رقم اللوحة',
        price: 'السعر اليومي',
        location: 'الموقع',
        chooseBrand: 'اختر العلامة التجارية',
        otherBrand: 'علامة أخرى...',
        mileage: 'المسافة المقطوعة',
        oilChange: 'تغيير الزيت القادم (كم)',
        technicalInspection: 'تاريخ الفحص الفني',
        status: 'الحالة',
        available: 'متاحة',
        rented: 'مستأجرة',
        maintenance: 'صيانة',
        actions: 'إجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        images: 'الصور'
      },
      rentals: {
        title: 'إدارة الإيجارات',
        new: 'إيجار جديد',
        customer: 'العميل',
        phone: 'الهاتف',
        idNumber: 'رقم الهوية',
        startDate: 'تاريخ البدء',
        endDate: 'تاريخ الانتهاء',
        totalPrice: 'السعر الإجمالي',
        validate: 'تأكيد الإيجار',
        contract: 'العقد',
        generatePdf: 'توليد عقد PDF',
        statePhotos: 'صور حالة السيارة (5 مطلوبة)',
        uploadPhotos: 'تحميل الصور',
        amountPaid: 'المبلغ المدفوع',
        amountRemaining: 'المبلغ المتبقي',
        period: 'الفترة'
      },
      customers: {
        title: 'إدارة العملاء',
        add: 'عميل جديد',
        name: 'اللقب',
        firstName: 'الاسم',
        type: 'النوع',
        individual: 'فرد',
        company: 'شركة',
        nationality: 'الجنسية',
        city: 'المدينة',
        country: 'البلد',
        history: 'تاريخ الإيجارات'
      },
      invoices: {
        title: 'إدارة الفواتير',
        selectClient: 'اختر عميلاً',
        searchPlaceholder: 'رقم الهوية، الاسم، اسم الشركة، الهاتف...',
        generate: 'توليد الفاتورة',
        noRentals: 'لم يتم العثور على إيجارات لهذا العميل',
        selectedRentals: 'الإيجارات المختارة',
        clientType: 'نوع العميل',
        individual: 'فرد',
        company: 'شركة',
        observation: 'ملاحظة'
      },
      common: {
        save: 'حفظ',
        cancel: 'إلغاء',
        search: 'بحث',
        loading: 'جاري التحميل...',
        error: 'حدث خطأ ما',
        success: 'تمت العملية بنجاح',
        noResults: 'لا توجد نتائج'
      },
      pagination: {
        rowsPerPage: 'عدد الصفوف في الصفحة',
        of: 'من',
        pageOf: 'الصفحة {{current}} من {{total}}',
        displayRows: 'عرض {{from}} إلى {{to}} من {{total}} صف',
        next: 'التالي',
        previous: 'السابق',
        first: 'الصفحة الأولى',
        last: 'الصفحة الأخيرة'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
