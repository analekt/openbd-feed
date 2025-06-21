export interface OpenBDBook {
  onix: {
    RecordReference: string;
    ProductIdentifier: {
      ProductIDType: string;
      IDValue: string;
    }[];
    DescriptiveDetail: {
      ProductComposition?: string;
      ProductForm?: string;
      ProductFormDetail?: string;
      TitleDetail: {
        TitleType: string;
        TitleElement: {
          TitleElementLevel: string;
          PartNumber?: string;
          TitleText: {
            content: string;
            collationkey?: string;
          };
          Subtitle?: {
            content: string;
            collationkey?: string;
          };
        }[];
      }[];
      Contributor?: {
        SequenceNumber?: string;
        ContributorRole: string[];
        PersonName?: {
          content: string;
          collationkey?: string;
        };
        PersonNameInverted?: {
          content: string;
          collationkey?: string;
        };
      }[];
      Language?: {
        LanguageRole: string;
        LanguageCode: string;
      }[];
      Subject?: {
        SubjectSchemeIdentifier: string;
        SubjectCode?: string;
        SubjectHeadingText?: string;
      }[];
      Audience?: {
        AudienceCodeType: string;
        AudienceCodeValue: string;
      }[];
    };
    CollateralDetail?: {
      TextContent?: {
        TextType: string;
        ContentAudience: string;
        Text: string;
      }[];
      SupportingResource?: {
        ResourceContentType: string;
        ContentAudience: string;
        ResourceMode: string;
        ResourceVersion: {
          ResourceLink: string;
          ResourceVersionFeature?: {
            ResourceVersionFeatureType: string;
            FeatureValue: string;
          }[];
        }[];
      }[];
    };
    PublishingDetail: {
      Imprint?: {
        ImprintIdentifier?: {
          ImprintIDType: string;
          IDValue: string;
        }[];
        ImprintName: string;
      };
      Publisher?: {
        PublisherIdentifier?: {
          PublisherIDType: string;
          IDValue: string;
        }[];
        PublishingRole: string;
        PublisherName: string;
      };
      PublishingDate?: {
        PublishingDateRole: string;
        Date: string;
      }[];
    };
    ProductSupply?: {
      SupplyDetail: {
        Supplier: {
          SupplierRole: string;
          SupplierName?: string;
        };
        ProductAvailability: string;
        Price?: {
          PriceType: string;
          CurrencyCode: string;
          PriceAmount: string;
        }[];
      };
    };
  };
  hanmoto?: {
    dateshuppan?: string;
    datemodified?: string;
    datecreated?: string;
  };
  summary?: {
    isbn: string;
    title: string;
    volume?: string;
    series?: string;
    publisher: string;
    pubdate: string;
    cover?: string;
    author: string;
  };
}