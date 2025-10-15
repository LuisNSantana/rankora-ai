// Firecrawl extraction schemas for business intelligence

export const competitorAnalysisSchema = {
  type: "object",
  properties: {
    company: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        website: { type: "string" },
        industry: { type: "string" },
        foundedYear: { type: "string" },
        headquarters: { type: "string" },
        employeeCount: { type: "string" }
      },
      required: ["name", "description", "website"]
    },
    businessModel: {
      type: "object",
      properties: {
        revenueStreams: {
          type: "array",
          items: { type: "string" }
        },
        targetMarket: { type: "string" },
        valueProposition: { type: "string" },
        customerSegments: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    pricing: {
      type: "object",
      properties: {
        model: { type: "string" },
        plans: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "string" },
              billing: { type: "string" },
              features: {
                type: "array",
                items: { type: "string" }
              },
              limitations: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["name", "price", "features"]
          }
        }
      }
    },
    features: {
      type: "object",
      properties: {
        core: {
          type: "array",
          items: { type: "string" }
        },
        advanced: {
          type: "array",
          items: { type: "string" }
        },
        integrations: {
          type: "array",
          items: { type: "string" }
        },
        apiAccess: { type: "boolean" },
        mobileApp: { type: "boolean" }
      }
    },
    marketing: {
      type: "object",
      properties: {
        keyMessages: {
          type: "array",
          items: { type: "string" }
        },
        differentiators: {
          type: "array",
          items: { type: "string" }
        },
        socialProof: {
          type: "object",
          properties: {
            customerCount: { type: "string" },
            testimonials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  author: { type: "string" },
                  company: { type: "string" },
                  title: { type: "string" }
                }
              }
            },
            caseStudies: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      }
    },
    financial: {
      type: "object",
      properties: {
        funding: {
          type: "object",
          properties: {
            totalRaised: { type: "string" },
            lastRound: { type: "string" },
            investors: {
              type: "array",
              items: { type: "string" }
            },
            valuation: { type: "string" }
          }
        },
        revenue: { type: "string" },
        profitability: { type: "string" }
      }
    },
    team: {
      type: "object",
      properties: {
        leadership: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              title: { type: "string" },
              background: { type: "string" }
            }
          }
        },
        keyPersonnel: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    technology: {
      type: "object",
      properties: {
        techStack: {
          type: "array",
          items: { type: "string" }
        },
        infrastructure: { type: "string" },
        security: {
          type: "array",
          items: { type: "string" }
        },
        compliance: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    performance: {
      type: "object",
      properties: {
        websiteTraffic: { type: "string" },
        userGrowth: { type: "string" },
        marketShare: { type: "string" },
        customerSatisfaction: { type: "string" }
      }
    }
  },
  required: ["company", "pricing", "features"]
};

export const marketAnalysisSchema = {
  type: "object",
  properties: {
    marketOverview: {
      type: "object",
      properties: {
        industryName: { type: "string" },
        marketSize: {
          type: "object",
          properties: {
            current: { type: "string" },
            projected: { type: "string" },
            growthRate: { type: "string" }
          }
        },
        keySegments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              size: { type: "string" },
              growthRate: { type: "string" }
            }
          }
        }
      }
    },
    trends: {
      type: "object",
      properties: {
        emerging: {
          type: "array",
          items: { type: "string" }
        },
        declining: {
          type: "array",
          items: { type: "string" }
        },
        technological: {
          type: "array",
          items: { type: "string" }
        },
        regulatory: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    competitiveLandscape: {
      type: "object",
      properties: {
        marketLeaders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              marketShare: { type: "string" },
              keyStrengths: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        emergingPlayers: {
          type: "array",
          items: { type: "string" }
        },
        competitiveFactors: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    customerAnalysis: {
      type: "object",
      properties: {
        demographics: {
          type: "object",
          properties: {
            primarySegments: {
              type: "array",
              items: { type: "string" }
            },
            geography: {
              type: "array",
              items: { type: "string" }
            },
            companySize: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        behavior: {
          type: "object",
          properties: {
            purchaseDrivers: {
              type: "array",
              items: { type: "string" }
            },
            decisionProcess: { type: "string" },
            averageContractValue: { type: "string" },
            churnRate: { type: "string" }
          }
        },
        painPoints: {
          type: "array",
          items: { type: "string" }
        },
        unmetNeeds: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    opportunities: {
      type: "object",
      properties: {
        marketGaps: {
          type: "array",
          items: { type: "string" }
        },
        underservedSegments: {
          type: "array",
          items: { type: "string" }
        },
        emergingTechnologies: {
          type: "array",
          items: { type: "string" }
        },
        partnerships: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    threats: {
      type: "object",
      properties: {
        newEntrants: {
          type: "array",
          items: { type: "string" }
        },
        substitutes: {
          type: "array",
          items: { type: "string" }
        },
        regulatoryRisks: {
          type: "array",
          items: { type: "string" }
        },
        economicFactors: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  },
  required: ["marketOverview", "trends", "competitiveLandscape", "customerAnalysis"]
};

export const websiteAuditSchema = {
  type: "object",
  properties: {
    basicInfo: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        url: { type: "string" },
        industry: { type: "string" },
        companyType: { type: "string" }
      },
      required: ["title", "url"]
    },
    content: {
      type: "object",
      properties: {
        structure: {
          type: "object",
          properties: {
            headings: {
              type: "array",
              items: { type: "string" }
            },
            mainSections: {
              type: "array",
              items: { type: "string" }
            },
            navigation: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        messaging: {
          type: "object",
          properties: {
            valueProposition: { type: "string" },
            keyBenefits: {
              type: "array",
              items: { type: "string" }
            },
            callsToAction: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        quality: {
          type: "object",
          properties: {
            clarity: { type: "number" },
            completeness: { type: "number" },
            relevance: { type: "number" }
          }
        }
      }
    },
    userExperience: {
      type: "object",
      properties: {
        design: {
          type: "object",
          properties: {
            modernness: { type: "number" },
            professionalism: { type: "number" },
            brandConsistency: { type: "number" }
          }
        },
        usability: {
          type: "object",
          properties: {
            navigationClarity: { type: "number" },
            informationArchitecture: { type: "number" },
            mobileResponsiveness: { type: "number" }
          }
        },
        conversion: {
          type: "object",
          properties: {
            ctaVisibility: { type: "number" },
            trustSignals: {
              type: "array",
              items: { type: "string" }
            },
            socialProof: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      }
    },
    technical: {
      type: "object",
      properties: {
        performance: {
          type: "object",
          properties: {
            estimatedLoadTime: { type: "string" },
            optimization: { type: "number" }
          }
        },
        seo: {
          type: "object",
          properties: {
            metaTags: { type: "boolean" },
            keywords: {
              type: "array",
              items: { type: "string" }
            },
            structuredData: { type: "boolean" }
          }
        },
        security: {
          type: "object",
          properties: {
            httpsEnabled: { type: "boolean" },
            securityHeaders: { type: "boolean" }
          }
        }
      }
    },
    businessIntelligence: {
      type: "object",
      properties: {
        positioning: {
          type: "object",
          properties: {
            targetAudience: { type: "string" },
            marketPosition: { type: "string" },
            competitiveAdvantage: { type: "string" }
          }
        },
        offerings: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: { type: "string" }
            },
            services: {
              type: "array",
              items: { type: "string" }
            },
            pricing: { type: "string" }
          }
        },
        credibility: {
          type: "object",
          properties: {
            awards: {
              type: "array",
              items: { type: "string" }
            },
            certifications: {
              type: "array",
              items: { type: "string" }
            },
            partnerships: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      }
    }
  },
  required: ["basicInfo", "content", "userExperience"]
};

export const industryResearchSchema = {
  type: "object",
  properties: {
    overview: {
      type: "object",
      properties: {
        industryName: { type: "string" },
        definition: { type: "string" },
        keyCharacteristics: {
          type: "array",
          items: { type: "string" }
        },
        regulatoryEnvironment: { type: "string" }
      }
    },
    marketDynamics: {
      type: "object",
      properties: {
        size: {
          type: "object",
          properties: {
            global: { type: "string" },
            regional: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  size: { type: "string" }
                }
              }
            }
          }
        },
        growth: {
          type: "object",
          properties: {
            historicalRate: { type: "string" },
            projectedRate: { type: "string" },
            drivingFactors: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      }
    },
    keyPlayers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          marketShare: { type: "string" },
          revenue: { type: "string" },
          specialization: { type: "string" }
        }
      }
    },
    trendAnalysis: {
      type: "object",
      properties: {
        currentTrends: {
          type: "array",
          items: { type: "string" }
        },
        emergingTrends: {
          type: "array",
          items: { type: "string" }
        },
        disruptiveTechnologies: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    challenges: {
      type: "array",
      items: { type: "string" }
    },
    opportunities: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["overview", "marketDynamics", "keyPlayers", "trendAnalysis"]
};

export const pricingAnalysisSchema = {
  type: "object",
  properties: {
    company: {
      type: "object",
      properties: {
        name: { type: "string" },
        website: { type: "string" }
      }
    },
    pricingStrategy: {
      type: "object",
      properties: {
        model: { type: "string" },
        approach: { type: "string" },
        valueMetric: { type: "string" }
      }
    },
    plans: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "string" },
          billingCycle: { type: "string" },
          targetSegment: { type: "string" },
          features: {
            type: "array",
            items: { type: "string" }
          },
          limitations: {
            type: "array",
            items: { type: "string" }
          },
          additionalCosts: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["name", "price", "features"]
      }
    },
    addOns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "string" },
          description: { type: "string" }
        }
      }
    },
    discounts: {
      type: "object",
      properties: {
        annualDiscount: { type: "string" },
        volumeDiscounts: {
          type: "array",
          items: { type: "string" }
        },
        startupPrograms: { type: "boolean" },
        nonprofitDiscount: { type: "boolean" }
      }
    },
    freeTrial: {
      type: "object",
      properties: {
        available: { type: "boolean" },
        duration: { type: "string" },
        features: {
          type: "array",
          items: { type: "string" }
        },
        limitations: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    competitivePositioning: {
      type: "object",
      properties: {
        pricePoint: { type: "string" },
        valueForMoney: { type: "string" },
        differentiators: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  },
  required: ["company", "pricingStrategy", "plans"]
};