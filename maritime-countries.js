/* Maritime countries with a real principal seaport, used by both the opportunity
   form (<select>) and <trade-globe> (clickable country polygons).

   Coordinates are port/city-level (2 decimals, ~±5 km) — enough to place a pin and
   an arc endpoint on a globe, NOT a substitute for a berth coordinate. Port ids are
   internal keys (COUNTRY_SLUG) except for the originally curated set, which keeps its
   UN/LOCODE ids. Landlocked countries are deliberately absent, so a click on them
   does nothing. Countries whose principal port could not be stated with confidence
   were left out rather than guessed.

   12 of these 134 have no clickable polygon on the globe: AG, AW, BB, BH, CV, CW,
   LC, MT, MU, MV, SC, SG. Not a code/name mismatch — world-atlas countries-110m
   carries 177 country geometries and omits these small island states/microstates at
   that resolution. They remain fully usable in the form selects. */
(function () {
  const C = [
    { code: 'US', nameEs: 'Estados Unidos', nameEn: 'United States', lat: 39.5, lon: -98.35, ports: [
      { id: 'USSEA', name: 'Seattle', lat: 47.61, lon: -122.33 },
      { id: 'USTIW', name: 'Tacoma', lat: 47.25, lon: -122.44 },
      { id: 'USLAX', name: 'Los Angeles', lat: 33.74, lon: -118.27 },
      { id: 'USLGB', name: 'Long Beach', lat: 33.75, lon: -118.19 },
      { id: 'USHOU', name: 'Houston', lat: 29.75, lon: -95.28 },
      { id: 'USPEF', name: 'Port Everglades', lat: 26.09, lon: -80.12 },
      { id: 'USMIA', name: 'Miami', lat: 25.77, lon: -80.17 }
    ] },
    { code: 'PE', nameEs: 'Perú', nameEn: 'Peru', lat: -9.19, lon: -75.02, ports: [
      { id: 'PECLL', name: 'Callao', lat: -12.05, lon: -77.15 },
      { id: 'PEPAI', name: 'Paita', lat: -5.09, lon: -81.11 }
    ] },
    { code: 'CO', nameEs: 'Colombia', nameEn: 'Colombia', lat: 4.57, lon: -74.3, ports: [
      { id: 'COCTG', name: 'Cartagena', lat: 10.4, lon: -75.51 },
      { id: 'COBUN', name: 'Buenaventura', lat: 3.89, lon: -77.07 }
    ] },
    { code: 'EC', nameEs: 'Ecuador', nameEn: 'Ecuador', lat: -1.83, lon: -78.18, ports: [
      { id: 'ECGYE', name: 'Guayaquil', lat: -2.19, lon: -79.88 }
    ] },
    { code: 'CL', nameEs: 'Chile', nameEn: 'Chile', lat: -35.68, lon: -71.54, ports: [
      { id: 'CLSAI', name: 'San Antonio', lat: -33.59, lon: -71.61 },
      { id: 'CLVAP', name: 'Valparaíso', lat: -33.04, lon: -71.63 }
    ] },
    { code: 'PA', nameEs: 'Panamá', nameEn: 'Panama', lat: 8.54, lon: -80.78, ports: [
      { id: 'PABLB', name: 'Balboa', lat: 8.95, lon: -79.57 },
      { id: 'PAONX', name: 'Colón', lat: 9.36, lon: -79.9 }
    ] },
    { code: 'CR', nameEs: 'Costa Rica', nameEn: 'Costa Rica', lat: 9.75, lon: -83.75, ports: [
      { id: 'CRLIO', name: 'Puerto Limón', lat: 10.0, lon: -83.03 },
      { id: 'CRCAL', name: 'Caldera', lat: 9.91, lon: -84.72 }
    ] },
    { code: 'GT', nameEs: 'Guatemala', nameEn: 'Guatemala', lat: 15.78, lon: -90.23, ports: [
      { id: 'GTPRQ', name: 'Puerto Quetzal', lat: 13.92, lon: -90.79 },
      { id: 'GTSTC', name: 'Santo Tomás de Castilla', lat: 15.69, lon: -88.61 }
    ] },
    { code: 'BR', nameEs: 'Brasil', nameEn: 'Brazil', lat: -14.24, lon: -51.93, ports: [
      { id: 'BRSSZ', name: 'Santos', lat: -23.96, lon: -46.33 },
      { id: 'BRPNG', name: 'Paranaguá', lat: -25.51, lon: -48.51 }
    ] },
    { code: 'MX', nameEs: 'México', nameEn: 'Mexico', lat: 23.63, lon: -102.55, ports: [
      { id: 'MXZLO', name: 'Manzanillo', lat: 19.05, lon: -104.31 },
      { id: 'MXVER', name: 'Veracruz', lat: 19.19, lon: -96.13 }
    ] },

    { code: 'AE', nameEs: 'Emiratos Árabes Unidos', nameEn: 'United Arab Emirates', lat: 23.42, lon: 53.85, ports: [
      { id: 'AE_JEBELALI', name: 'Jebel Ali', lat: 25.01, lon: 55.06 },
      { id: 'AE_KHALIFA', name: 'Khalifa (Abu Dhabi)', lat: 24.8, lon: 54.64 }
    ] },
    { code: 'AG', nameEs: 'Antigua y Barbuda', nameEn: 'Antigua and Barbuda', lat: 17.06, lon: -61.8, ports: [
      { id: 'AG_STJOHNS', name: "St. John's", lat: 17.12, lon: -61.85 }
    ] },
    { code: 'AL', nameEs: 'Albania', nameEn: 'Albania', lat: 41.15, lon: 20.17, ports: [
      { id: 'AL_DURRES', name: 'Durrës', lat: 41.31, lon: 19.45 }
    ] },
    { code: 'AO', nameEs: 'Angola', nameEn: 'Angola', lat: -11.2, lon: 17.87, ports: [
      { id: 'AO_LUANDA', name: 'Luanda', lat: -8.78, lon: 13.23 },
      { id: 'AO_LOBITO', name: 'Lobito', lat: -12.35, lon: 13.55 }
    ] },
    { code: 'AR', nameEs: 'Argentina', nameEn: 'Argentina', lat: -38.42, lon: -63.62, ports: [
      { id: 'AR_BUENOSAIRES', name: 'Buenos Aires', lat: -34.58, lon: -58.37 },
      { id: 'AR_ROSARIO', name: 'Rosario', lat: -32.95, lon: -60.63 }
    ] },
    { code: 'AU', nameEs: 'Australia', nameEn: 'Australia', lat: -25.27, lon: 133.78, ports: [
      { id: 'AU_SYDNEY', name: 'Sydney (Port Botany)', lat: -33.98, lon: 151.22 },
      { id: 'AU_MELBOURNE', name: 'Melbourne', lat: -37.83, lon: 144.92 },
      { id: 'AU_BRISBANE', name: 'Brisbane', lat: -27.38, lon: 153.17 }
    ] },
    { code: 'AW', nameEs: 'Aruba', nameEn: 'Aruba', lat: 12.52, lon: -69.97, ports: [
      { id: 'AW_ORANJESTAD', name: 'Oranjestad', lat: 12.52, lon: -70.03 }
    ] },
    { code: 'BB', nameEs: 'Barbados', nameEn: 'Barbados', lat: 13.19, lon: -59.54, ports: [
      { id: 'BB_BRIDGETOWN', name: 'Bridgetown', lat: 13.1, lon: -59.62 }
    ] },
    { code: 'BD', nameEs: 'Bangladés', nameEn: 'Bangladesh', lat: 23.68, lon: 90.36, ports: [
      { id: 'BD_CHITTAGONG', name: 'Chittagong', lat: 22.31, lon: 91.8 }
    ] },
    { code: 'BE', nameEs: 'Bélgica', nameEn: 'Belgium', lat: 50.5, lon: 4.47, ports: [
      { id: 'BE_ANTWERP', name: 'Amberes (Antwerp)', lat: 51.26, lon: 4.4 },
      { id: 'BE_ZEEBRUGGE', name: 'Zeebrugge', lat: 51.33, lon: 3.2 }
    ] },
    { code: 'BG', nameEs: 'Bulgaria', nameEn: 'Bulgaria', lat: 42.73, lon: 25.49, ports: [
      { id: 'BG_VARNA', name: 'Varna', lat: 43.19, lon: 27.92 },
      { id: 'BG_BURGAS', name: 'Burgas', lat: 42.49, lon: 27.48 }
    ] },
    { code: 'BH', nameEs: 'Baréin', nameEn: 'Bahrain', lat: 26.07, lon: 50.56, ports: [
      { id: 'BH_KHALIFABINSALMAN', name: 'Khalifa Bin Salman', lat: 26.2, lon: 50.66 }
    ] },
    { code: 'BJ', nameEs: 'Benín', nameEn: 'Benin', lat: 9.31, lon: 2.32, ports: [
      { id: 'BJ_COTONOU', name: 'Cotonou', lat: 6.35, lon: 2.43 }
    ] },
    { code: 'BN', nameEs: 'Brunéi', nameEn: 'Brunei', lat: 4.54, lon: 114.73, ports: [
      { id: 'BN_MUARA', name: 'Muara', lat: 5.02, lon: 115.07 }
    ] },
    { code: 'BS', nameEs: 'Bahamas', nameEn: 'Bahamas', lat: 25.03, lon: -77.4, ports: [
      { id: 'BS_FREEPORT', name: 'Freeport', lat: 26.53, lon: -78.7 },
      { id: 'BS_NASSAU', name: 'Nassau', lat: 25.08, lon: -77.34 }
    ] },
    { code: 'BZ', nameEs: 'Belice', nameEn: 'Belize', lat: 17.19, lon: -88.5, ports: [
      { id: 'BZ_BELIZECITY', name: 'Belize City', lat: 17.5, lon: -88.19 }
    ] },
    { code: 'CA', nameEs: 'Canadá', nameEn: 'Canada', lat: 56.13, lon: -106.35, ports: [
      { id: 'CA_VANCOUVER', name: 'Vancouver', lat: 49.29, lon: -123.11 },
      { id: 'CA_MONTREAL', name: 'Montreal', lat: 45.55, lon: -73.53 },
      { id: 'CA_HALIFAX', name: 'Halifax', lat: 44.65, lon: -63.57 }
    ] },
    { code: 'CD', nameEs: 'R. D. del Congo', nameEn: 'Democratic Republic of the Congo', lat: -4.04, lon: 21.76, ports: [
      { id: 'CD_MATADI', name: 'Matadi', lat: -5.82, lon: 13.46 }
    ] },
    { code: 'CG', nameEs: 'Congo', nameEn: 'Republic of the Congo', lat: -0.23, lon: 15.83, ports: [
      { id: 'CG_POINTENOIRE', name: 'Pointe-Noire', lat: -4.78, lon: 11.85 }
    ] },
    { code: 'CI', nameEs: 'Costa de Marfil', nameEn: "Côte d'Ivoire", lat: 7.54, lon: -5.55, ports: [
      { id: 'CI_ABIDJAN', name: 'Abiyán (Abidjan)', lat: 5.28, lon: -4.01 }
    ] },
    { code: 'CM', nameEs: 'Camerún', nameEn: 'Cameroon', lat: 7.37, lon: 12.35, ports: [
      { id: 'CM_DOUALA', name: 'Douala', lat: 4.05, lon: 9.69 },
      { id: 'CM_KRIBI', name: 'Kribi', lat: 2.94, lon: 9.91 }
    ] },
    { code: 'CN', nameEs: 'China', nameEn: 'China', lat: 35.86, lon: 104.2, ports: [
      { id: 'CN_SHANGHAI', name: 'Shanghái', lat: 31.23, lon: 121.47 },
      { id: 'CN_NINGBO', name: 'Ningbo-Zhoushan', lat: 29.87, lon: 121.85 },
      { id: 'CN_SHENZHEN', name: 'Shenzhen (Yantian)', lat: 22.58, lon: 114.27 },
      { id: 'CN_QINGDAO', name: 'Qingdao', lat: 36.07, lon: 120.32 }
    ] },
    { code: 'CU', nameEs: 'Cuba', nameEn: 'Cuba', lat: 21.52, lon: -77.78, ports: [
      { id: 'CU_MARIEL', name: 'Mariel', lat: 23.0, lon: -82.75 },
      { id: 'CU_HAVANA', name: 'La Habana', lat: 23.13, lon: -82.35 }
    ] },
    { code: 'CV', nameEs: 'Cabo Verde', nameEn: 'Cabo Verde', lat: 16.0, lon: -24.01, ports: [
      { id: 'CV_PORTOGRANDE', name: 'Porto Grande (Mindelo)', lat: 16.88, lon: -25.0 }
    ] },
    { code: 'CW', nameEs: 'Curazao', nameEn: 'Curaçao', lat: 12.17, lon: -68.99, ports: [
      { id: 'CW_WILLEMSTAD', name: 'Willemstad', lat: 12.11, lon: -68.93 }
    ] },
    { code: 'CY', nameEs: 'Chipre', nameEn: 'Cyprus', lat: 35.13, lon: 33.43, ports: [
      { id: 'CY_LIMASSOL', name: 'Limassol', lat: 34.65, lon: 33.02 }
    ] },
    { code: 'DE', nameEs: 'Alemania', nameEn: 'Germany', lat: 51.17, lon: 10.45, ports: [
      { id: 'DE_HAMBURG', name: 'Hamburgo', lat: 53.54, lon: 9.97 },
      { id: 'DE_BREMERHAVEN', name: 'Bremerhaven', lat: 53.55, lon: 8.57 }
    ] },
    { code: 'DJ', nameEs: 'Yibuti', nameEn: 'Djibouti', lat: 11.83, lon: 42.59, ports: [
      { id: 'DJ_DJIBOUTI', name: 'Djibouti', lat: 11.6, lon: 43.14 }
    ] },
    { code: 'DK', nameEs: 'Dinamarca', nameEn: 'Denmark', lat: 56.26, lon: 9.5, ports: [
      { id: 'DK_AARHUS', name: 'Aarhus', lat: 56.15, lon: 10.22 },
      { id: 'DK_COPENHAGEN', name: 'Copenhague', lat: 55.7, lon: 12.6 }
    ] },
    { code: 'DO', nameEs: 'República Dominicana', nameEn: 'Dominican Republic', lat: 18.74, lon: -70.16, ports: [
      { id: 'DO_CAUCEDO', name: 'Caucedo', lat: 18.42, lon: -69.63 },
      { id: 'DO_HAINA', name: 'Haina', lat: 18.42, lon: -70.02 }
    ] },
    { code: 'DZ', nameEs: 'Argelia', nameEn: 'Algeria', lat: 28.03, lon: 1.66, ports: [
      { id: 'DZ_ALGIERS', name: 'Argel', lat: 36.77, lon: 3.07 },
      { id: 'DZ_ORAN', name: 'Orán', lat: 35.71, lon: -0.64 }
    ] },
    { code: 'EE', nameEs: 'Estonia', nameEn: 'Estonia', lat: 58.6, lon: 25.01, ports: [
      { id: 'EE_MUUGA', name: 'Tallin (Muuga)', lat: 59.48, lon: 24.95 }
    ] },
    { code: 'EG', nameEs: 'Egipto', nameEn: 'Egypt', lat: 26.82, lon: 30.8, ports: [
      { id: 'EG_PORTSAID', name: 'Port Said', lat: 31.26, lon: 32.3 },
      { id: 'EG_ALEXANDRIA', name: 'Alejandría', lat: 31.19, lon: 29.87 },
      { id: 'EG_DAMIETTA', name: 'Damietta', lat: 31.47, lon: 31.76 }
    ] },
    { code: 'ER', nameEs: 'Eritrea', nameEn: 'Eritrea', lat: 15.18, lon: 39.78, ports: [
      { id: 'ER_MASSAWA', name: 'Massawa', lat: 15.61, lon: 39.45 }
    ] },
    { code: 'ES', nameEs: 'España', nameEn: 'Spain', lat: 40.46, lon: -3.75, ports: [
      { id: 'ES_VALENCIA', name: 'Valencia', lat: 39.44, lon: -0.31 },
      { id: 'ES_ALGECIRAS', name: 'Algeciras', lat: 36.13, lon: -5.44 },
      { id: 'ES_BARCELONA', name: 'Barcelona', lat: 41.35, lon: 2.17 }
    ] },
    { code: 'FI', nameEs: 'Finlandia', nameEn: 'Finland', lat: 61.92, lon: 25.75, ports: [
      { id: 'FI_VUOSAARI', name: 'Helsinki (Vuosaari)', lat: 60.21, lon: 25.19 },
      { id: 'FI_KOTKA', name: 'Kotka', lat: 60.46, lon: 26.95 }
    ] },
    { code: 'FJ', nameEs: 'Fiyi', nameEn: 'Fiji', lat: -17.71, lon: 178.07, ports: [
      { id: 'FJ_SUVA', name: 'Suva', lat: -18.13, lon: 178.42 }
    ] },
    { code: 'FR', nameEs: 'Francia', nameEn: 'France', lat: 46.23, lon: 2.21, ports: [
      { id: 'FR_LEHAVRE', name: 'Le Havre', lat: 49.48, lon: 0.13 },
      { id: 'FR_MARSEILLE', name: 'Marsella-Fos', lat: 43.4, lon: 4.89 },
      { id: 'FR_DUNKERQUE', name: 'Dunkerque', lat: 51.03, lon: 2.37 }
    ] },
    { code: 'GA', nameEs: 'Gabón', nameEn: 'Gabon', lat: -0.8, lon: 11.61, ports: [
      { id: 'GA_OWENDO', name: 'Owendo', lat: 0.28, lon: 9.5 }
    ] },
    { code: 'GB', nameEs: 'Reino Unido', nameEn: 'United Kingdom', lat: 55.38, lon: -3.44, ports: [
      { id: 'GB_FELIXSTOWE', name: 'Felixstowe', lat: 51.95, lon: 1.32 },
      { id: 'GB_SOUTHAMPTON', name: 'Southampton', lat: 50.9, lon: -1.42 },
      { id: 'GB_LONDONGATEWAY', name: 'London Gateway', lat: 51.51, lon: 0.49 }
    ] },
    { code: 'GE', nameEs: 'Georgia', nameEn: 'Georgia', lat: 42.32, lon: 43.36, ports: [
      { id: 'GE_POTI', name: 'Poti', lat: 42.15, lon: 41.67 },
      { id: 'GE_BATUMI', name: 'Batumi', lat: 41.65, lon: 41.64 }
    ] },
    { code: 'GH', nameEs: 'Ghana', nameEn: 'Ghana', lat: 7.95, lon: -1.03, ports: [
      { id: 'GH_TEMA', name: 'Tema', lat: 5.63, lon: 0.01 },
      { id: 'GH_TAKORADI', name: 'Takoradi', lat: 4.89, lon: -1.74 }
    ] },
    { code: 'GM', nameEs: 'Gambia', nameEn: 'Gambia', lat: 13.44, lon: -15.31, ports: [
      { id: 'GM_BANJUL', name: 'Banjul', lat: 13.45, lon: -16.58 }
    ] },
    { code: 'GN', nameEs: 'Guinea', nameEn: 'Guinea', lat: 9.95, lon: -9.7, ports: [
      { id: 'GN_CONAKRY', name: 'Conakry', lat: 9.51, lon: -13.71 }
    ] },
    { code: 'GQ', nameEs: 'Guinea Ecuatorial', nameEn: 'Equatorial Guinea', lat: 1.65, lon: 10.27, ports: [
      { id: 'GQ_MALABO', name: 'Malabo', lat: 3.75, lon: 8.78 },
      { id: 'GQ_BATA', name: 'Bata', lat: 1.86, lon: 9.76 }
    ] },
    { code: 'GR', nameEs: 'Grecia', nameEn: 'Greece', lat: 39.07, lon: 21.82, ports: [
      { id: 'GR_PIRAEUS', name: 'El Pireo (Piraeus)', lat: 37.94, lon: 23.64 },
      { id: 'GR_THESSALONIKI', name: 'Salónica', lat: 40.63, lon: 22.93 }
    ] },
    { code: 'GW', nameEs: 'Guinea-Bisáu', nameEn: 'Guinea-Bissau', lat: 11.8, lon: -15.18, ports: [
      { id: 'GW_BISSAU', name: 'Bissau', lat: 11.86, lon: -15.6 }
    ] },
    { code: 'GY', nameEs: 'Guyana', nameEn: 'Guyana', lat: 4.86, lon: -58.93, ports: [
      { id: 'GY_GEORGETOWN', name: 'Georgetown', lat: 6.81, lon: -58.16 }
    ] },
    { code: 'HN', nameEs: 'Honduras', nameEn: 'Honduras', lat: 15.2, lon: -86.24, ports: [
      { id: 'HN_PUERTOCORTES', name: 'Puerto Cortés', lat: 15.85, lon: -87.95 }
    ] },
    { code: 'HR', nameEs: 'Croacia', nameEn: 'Croatia', lat: 45.1, lon: 15.2, ports: [
      { id: 'HR_RIJEKA', name: 'Rijeka', lat: 45.33, lon: 14.44 }
    ] },
    { code: 'HT', nameEs: 'Haití', nameEn: 'Haiti', lat: 18.97, lon: -72.29, ports: [
      { id: 'HT_PORTAUPRINCE', name: 'Puerto Príncipe', lat: 18.56, lon: -72.35 }
    ] },
    { code: 'ID', nameEs: 'Indonesia', nameEn: 'Indonesia', lat: -0.79, lon: 113.92, ports: [
      { id: 'ID_TANJUNGPRIOK', name: 'Tanjung Priok (Yakarta)', lat: -6.1, lon: 106.88 },
      { id: 'ID_TANJUNGPERAK', name: 'Tanjung Perak (Surabaya)', lat: -7.2, lon: 112.73 }
    ] },
    { code: 'IE', nameEs: 'Irlanda', nameEn: 'Ireland', lat: 53.41, lon: -8.24, ports: [
      { id: 'IE_DUBLIN', name: 'Dublín', lat: 53.35, lon: -6.21 },
      { id: 'IE_CORK', name: 'Cork', lat: 51.85, lon: -8.3 }
    ] },
    { code: 'IL', nameEs: 'Israel', nameEn: 'Israel', lat: 31.05, lon: 34.85, ports: [
      { id: 'IL_HAIFA', name: 'Haifa', lat: 32.82, lon: 35.0 },
      { id: 'IL_ASHDOD', name: 'Ashdod', lat: 31.81, lon: 34.63 }
    ] },
    { code: 'IN', nameEs: 'India', nameEn: 'India', lat: 20.59, lon: 78.96, ports: [
      { id: 'IN_NHAVASHEVA', name: 'Nhava Sheva (JNPT)', lat: 18.95, lon: 72.95 },
      { id: 'IN_MUNDRA', name: 'Mundra', lat: 22.75, lon: 69.7 },
      { id: 'IN_CHENNAI', name: 'Chennai', lat: 13.1, lon: 80.29 }
    ] },
    { code: 'IQ', nameEs: 'Irak', nameEn: 'Iraq', lat: 33.22, lon: 43.68, ports: [
      { id: 'IQ_UMMQASR', name: 'Umm Qasr', lat: 30.03, lon: 47.93 }
    ] },
    { code: 'IR', nameEs: 'Irán', nameEn: 'Iran', lat: 32.43, lon: 53.69, ports: [
      { id: 'IR_BANDARABBAS', name: 'Bandar Abbas (Shahid Rajaee)', lat: 27.13, lon: 56.08 }
    ] },
    { code: 'IS', nameEs: 'Islandia', nameEn: 'Iceland', lat: 64.96, lon: -19.02, ports: [
      { id: 'IS_REYKJAVIK', name: 'Reikiavik', lat: 64.15, lon: -21.94 }
    ] },
    { code: 'IT', nameEs: 'Italia', nameEn: 'Italy', lat: 41.87, lon: 12.57, ports: [
      { id: 'IT_GIOIATAURO', name: 'Gioia Tauro', lat: 38.45, lon: 15.9 },
      { id: 'IT_GENOA', name: 'Génova', lat: 44.4, lon: 8.9 },
      { id: 'IT_TRIESTE', name: 'Trieste', lat: 45.65, lon: 13.76 }
    ] },
    { code: 'JM', nameEs: 'Jamaica', nameEn: 'Jamaica', lat: 18.11, lon: -77.3, ports: [
      { id: 'JM_KINGSTON', name: 'Kingston', lat: 17.98, lon: -76.83 }
    ] },
    { code: 'JO', nameEs: 'Jordania', nameEn: 'Jordan', lat: 30.59, lon: 36.24, ports: [
      { id: 'JO_AQABA', name: 'Áqaba', lat: 29.52, lon: 35.0 }
    ] },
    { code: 'JP', nameEs: 'Japón', nameEn: 'Japan', lat: 36.2, lon: 138.25, ports: [
      { id: 'JP_YOKOHAMA', name: 'Yokohama', lat: 35.45, lon: 139.66 },
      { id: 'JP_KOBE', name: 'Kobe', lat: 34.68, lon: 135.2 },
      { id: 'JP_NAGOYA', name: 'Nagoya', lat: 35.05, lon: 136.87 }
    ] },
    { code: 'KE', nameEs: 'Kenia', nameEn: 'Kenya', lat: -0.02, lon: 37.91, ports: [
      { id: 'KE_MOMBASA', name: 'Mombasa', lat: -4.06, lon: 39.66 },
      { id: 'KE_LAMU', name: 'Lamu', lat: -2.27, lon: 40.9 }
    ] },
    { code: 'KH', nameEs: 'Camboya', nameEn: 'Cambodia', lat: 12.57, lon: 104.99, ports: [
      { id: 'KH_SIHANOUKVILLE', name: 'Sihanoukville', lat: 10.63, lon: 103.51 }
    ] },
    { code: 'KR', nameEs: 'Corea del Sur', nameEn: 'South Korea', lat: 35.91, lon: 127.77, ports: [
      { id: 'KR_BUSAN', name: 'Busan', lat: 35.1, lon: 129.04 },
      { id: 'KR_INCHEON', name: 'Incheon', lat: 37.45, lon: 126.6 }
    ] },
    { code: 'KW', nameEs: 'Kuwait', nameEn: 'Kuwait', lat: 29.31, lon: 47.48, ports: [
      { id: 'KW_SHUAIBA', name: 'Shuaiba', lat: 29.35, lon: 47.93 }
    ] },
    { code: 'LB', nameEs: 'Líbano', nameEn: 'Lebanon', lat: 33.85, lon: 35.86, ports: [
      { id: 'LB_BEIRUT', name: 'Beirut', lat: 33.9, lon: 35.52 }
    ] },
    { code: 'LC', nameEs: 'Santa Lucía', nameEn: 'Saint Lucia', lat: 13.91, lon: -60.98, ports: [
      { id: 'LC_CASTRIES', name: 'Castries', lat: 14.02, lon: -60.99 }
    ] },
    { code: 'LK', nameEs: 'Sri Lanka', nameEn: 'Sri Lanka', lat: 7.87, lon: 80.77, ports: [
      { id: 'LK_COLOMBO', name: 'Colombo', lat: 6.95, lon: 79.84 }
    ] },
    { code: 'LR', nameEs: 'Liberia', nameEn: 'Liberia', lat: 6.43, lon: -9.43, ports: [
      { id: 'LR_MONROVIA', name: 'Monrovia', lat: 6.35, lon: -10.8 }
    ] },
    { code: 'LT', nameEs: 'Lituania', nameEn: 'Lithuania', lat: 55.17, lon: 23.88, ports: [
      { id: 'LT_KLAIPEDA', name: 'Klaipėda', lat: 55.7, lon: 21.14 }
    ] },
    { code: 'LV', nameEs: 'Letonia', nameEn: 'Latvia', lat: 56.88, lon: 24.6, ports: [
      { id: 'LV_RIGA', name: 'Riga', lat: 56.98, lon: 24.1 },
      { id: 'LV_VENTSPILS', name: 'Ventspils', lat: 57.4, lon: 21.55 }
    ] },
    { code: 'LY', nameEs: 'Libia', nameEn: 'Libya', lat: 26.34, lon: 17.23, ports: [
      { id: 'LY_MISRATA', name: 'Misrata', lat: 32.37, lon: 15.22 },
      { id: 'LY_TRIPOLI', name: 'Trípoli', lat: 32.9, lon: 13.18 }
    ] },
    { code: 'MA', nameEs: 'Marruecos', nameEn: 'Morocco', lat: 31.79, lon: -7.09, ports: [
      { id: 'MA_TANGERMED', name: 'Tanger Med', lat: 35.88, lon: -5.5 },
      { id: 'MA_CASABLANCA', name: 'Casablanca', lat: 33.6, lon: -7.61 }
    ] },
    { code: 'MG', nameEs: 'Madagascar', nameEn: 'Madagascar', lat: -18.77, lon: 46.87, ports: [
      { id: 'MG_TOAMASINA', name: 'Toamasina', lat: -18.15, lon: 49.42 }
    ] },
    { code: 'MM', nameEs: 'Myanmar', nameEn: 'Myanmar', lat: 21.91, lon: 95.96, ports: [
      { id: 'MM_YANGON', name: 'Yangon', lat: 16.77, lon: 96.17 }
    ] },
    { code: 'MR', nameEs: 'Mauritania', nameEn: 'Mauritania', lat: 21.01, lon: -10.94, ports: [
      { id: 'MR_NOUAKCHOTT', name: 'Nuakchot', lat: 18.02, lon: -16.03 }
    ] },
    { code: 'MT', nameEs: 'Malta', nameEn: 'Malta', lat: 35.94, lon: 14.38, ports: [
      { id: 'MT_MARSAXLOKK', name: 'Marsaxlokk (Malta Freeport)', lat: 35.82, lon: 14.54 }
    ] },
    { code: 'MU', nameEs: 'Mauricio', nameEn: 'Mauritius', lat: -20.35, lon: 57.55, ports: [
      { id: 'MU_PORTLOUIS', name: 'Port Louis', lat: -20.16, lon: 57.5 }
    ] },
    { code: 'MV', nameEs: 'Maldivas', nameEn: 'Maldives', lat: 3.2, lon: 73.22, ports: [
      { id: 'MV_MALE', name: 'Malé', lat: 4.18, lon: 73.51 }
    ] },
    { code: 'MY', nameEs: 'Malasia', nameEn: 'Malaysia', lat: 4.21, lon: 101.98, ports: [
      { id: 'MY_PORTKLANG', name: 'Port Klang', lat: 3.0, lon: 101.39 },
      { id: 'MY_TANJUNGPELEPAS', name: 'Tanjung Pelepas', lat: 1.36, lon: 103.55 }
    ] },
    { code: 'MZ', nameEs: 'Mozambique', nameEn: 'Mozambique', lat: -18.67, lon: 35.53, ports: [
      { id: 'MZ_MAPUTO', name: 'Maputo', lat: -25.97, lon: 32.58 },
      { id: 'MZ_NACALA', name: 'Nacala', lat: -14.53, lon: 40.68 }
    ] },
    { code: 'NA', nameEs: 'Namibia', nameEn: 'Namibia', lat: -22.96, lon: 18.49, ports: [
      { id: 'NA_WALVISBAY', name: 'Walvis Bay', lat: -22.95, lon: 14.5 }
    ] },
    { code: 'NG', nameEs: 'Nigeria', nameEn: 'Nigeria', lat: 9.08, lon: 8.68, ports: [
      { id: 'NG_APAPA', name: 'Lagos (Apapa)', lat: 6.44, lon: 3.36 },
      { id: 'NG_ONNE', name: 'Onne', lat: 4.71, lon: 7.15 }
    ] },
    { code: 'NI', nameEs: 'Nicaragua', nameEn: 'Nicaragua', lat: 12.87, lon: -85.21, ports: [
      { id: 'NI_CORINTO', name: 'Corinto', lat: 12.48, lon: -87.17 }
    ] },
    { code: 'NL', nameEs: 'Países Bajos', nameEn: 'Netherlands', lat: 52.13, lon: 5.29, ports: [
      { id: 'NL_ROTTERDAM', name: 'Róterdam', lat: 51.95, lon: 4.14 },
      { id: 'NL_AMSTERDAM', name: 'Ámsterdam', lat: 52.4, lon: 4.85 }
    ] },
    { code: 'NO', nameEs: 'Noruega', nameEn: 'Norway', lat: 60.47, lon: 8.47, ports: [
      { id: 'NO_OSLO', name: 'Oslo', lat: 59.9, lon: 10.73 },
      { id: 'NO_BERGEN', name: 'Bergen', lat: 60.4, lon: 5.32 }
    ] },
    { code: 'NZ', nameEs: 'Nueva Zelanda', nameEn: 'New Zealand', lat: -40.9, lon: 174.89, ports: [
      { id: 'NZ_AUCKLAND', name: 'Auckland', lat: -36.84, lon: 174.78 },
      { id: 'NZ_TAURANGA', name: 'Tauranga', lat: -37.65, lon: 176.18 }
    ] },
    { code: 'OM', nameEs: 'Omán', nameEn: 'Oman', lat: 21.51, lon: 55.92, ports: [
      { id: 'OM_SALALAH', name: 'Salalah', lat: 16.94, lon: 54.01 },
      { id: 'OM_SOHAR', name: 'Sohar', lat: 24.51, lon: 56.63 }
    ] },
    { code: 'PG', nameEs: 'Papúa Nueva Guinea', nameEn: 'Papua New Guinea', lat: -6.31, lon: 143.96, ports: [
      { id: 'PG_PORTMORESBY', name: 'Port Moresby', lat: -9.47, lon: 147.15 },
      { id: 'PG_LAE', name: 'Lae', lat: -6.73, lon: 146.99 }
    ] },
    { code: 'PH', nameEs: 'Filipinas', nameEn: 'Philippines', lat: 12.88, lon: 121.77, ports: [
      { id: 'PH_MANILA', name: 'Manila', lat: 14.6, lon: 120.96 },
      { id: 'PH_CEBU', name: 'Cebú', lat: 10.3, lon: 123.9 }
    ] },
    { code: 'PK', nameEs: 'Pakistán', nameEn: 'Pakistan', lat: 30.38, lon: 69.35, ports: [
      { id: 'PK_KARACHI', name: 'Karachi', lat: 24.84, lon: 66.98 },
      { id: 'PK_PORTQASIM', name: 'Port Qasim', lat: 24.79, lon: 67.34 }
    ] },
    { code: 'PL', nameEs: 'Polonia', nameEn: 'Poland', lat: 51.92, lon: 19.15, ports: [
      { id: 'PL_GDANSK', name: 'Gdańsk', lat: 54.4, lon: 18.68 },
      { id: 'PL_GDYNIA', name: 'Gdynia', lat: 54.53, lon: 18.55 }
    ] },
    { code: 'PT', nameEs: 'Portugal', nameEn: 'Portugal', lat: 39.4, lon: -8.22, ports: [
      { id: 'PT_SINES', name: 'Sines', lat: 37.95, lon: -8.87 },
      { id: 'PT_LISBON', name: 'Lisboa', lat: 38.7, lon: -9.15 },
      { id: 'PT_LEIXOES', name: 'Leixões', lat: 41.19, lon: -8.7 }
    ] },
    { code: 'QA', nameEs: 'Catar', nameEn: 'Qatar', lat: 25.35, lon: 51.18, ports: [
      { id: 'QA_HAMAD', name: 'Hamad', lat: 25.02, lon: 51.6 }
    ] },
    { code: 'RO', nameEs: 'Rumanía', nameEn: 'Romania', lat: 45.94, lon: 24.97, ports: [
      { id: 'RO_CONSTANTA', name: 'Constanza', lat: 44.17, lon: 28.65 }
    ] },
    { code: 'RU', nameEs: 'Rusia', nameEn: 'Russia', lat: 61.52, lon: 105.32, ports: [
      { id: 'RU_STPETERSBURG', name: 'San Petersburgo', lat: 59.9, lon: 30.24 },
      { id: 'RU_NOVOROSSIYSK', name: 'Novorossiysk', lat: 44.72, lon: 37.79 },
      { id: 'RU_VLADIVOSTOK', name: 'Vladivostok', lat: 43.11, lon: 131.89 }
    ] },
    { code: 'SA', nameEs: 'Arabia Saudita', nameEn: 'Saudi Arabia', lat: 23.89, lon: 45.08, ports: [
      { id: 'SA_JEDDAH', name: 'Yeda (Jeddah)', lat: 21.48, lon: 39.17 },
      { id: 'SA_DAMMAM', name: 'Dammam', lat: 26.51, lon: 50.2 }
    ] },
    { code: 'SB', nameEs: 'Islas Salomón', nameEn: 'Solomon Islands', lat: -9.65, lon: 160.16, ports: [
      { id: 'SB_HONIARA', name: 'Honiara', lat: -9.43, lon: 159.95 }
    ] },
    { code: 'SC', nameEs: 'Seychelles', nameEn: 'Seychelles', lat: -4.68, lon: 55.49, ports: [
      { id: 'SC_VICTORIA', name: 'Victoria', lat: -4.62, lon: 55.45 }
    ] },
    { code: 'SD', nameEs: 'Sudán', nameEn: 'Sudan', lat: 12.86, lon: 30.22, ports: [
      { id: 'SD_PORTSUDAN', name: 'Port Sudan', lat: 19.61, lon: 37.22 }
    ] },
    { code: 'SE', nameEs: 'Suecia', nameEn: 'Sweden', lat: 60.13, lon: 18.64, ports: [
      { id: 'SE_GOTHENBURG', name: 'Gotemburgo', lat: 57.69, lon: 11.85 }
    ] },
    { code: 'SG', nameEs: 'Singapur', nameEn: 'Singapore', lat: 1.35, lon: 103.82, ports: [
      { id: 'SG_SINGAPORE', name: 'Singapur', lat: 1.26, lon: 103.83 }
    ] },
    { code: 'SI', nameEs: 'Eslovenia', nameEn: 'Slovenia', lat: 46.15, lon: 14.99, ports: [
      { id: 'SI_KOPER', name: 'Koper', lat: 45.56, lon: 13.73 }
    ] },
    { code: 'SL', nameEs: 'Sierra Leona', nameEn: 'Sierra Leone', lat: 8.46, lon: -11.78, ports: [
      { id: 'SL_FREETOWN', name: 'Freetown', lat: 8.49, lon: -13.24 }
    ] },
    { code: 'SN', nameEs: 'Senegal', nameEn: 'Senegal', lat: 14.5, lon: -14.45, ports: [
      { id: 'SN_DAKAR', name: 'Dakar', lat: 14.68, lon: -17.42 }
    ] },
    { code: 'SO', nameEs: 'Somalia', nameEn: 'Somalia', lat: 5.15, lon: 46.2, ports: [
      { id: 'SO_MOGADISHU', name: 'Mogadiscio', lat: 2.03, lon: 45.34 },
      { id: 'SO_BERBERA', name: 'Berbera', lat: 10.44, lon: 45.02 }
    ] },
    { code: 'SR', nameEs: 'Surinam', nameEn: 'Suriname', lat: 3.92, lon: -56.03, ports: [
      { id: 'SR_PARAMARIBO', name: 'Paramaribo', lat: 5.82, lon: -55.15 }
    ] },
    { code: 'SV', nameEs: 'El Salvador', nameEn: 'El Salvador', lat: 13.79, lon: -88.9, ports: [
      { id: 'SV_ACAJUTLA', name: 'Acajutla', lat: 13.57, lon: -89.83 }
    ] },
    { code: 'SY', nameEs: 'Siria', nameEn: 'Syria', lat: 34.8, lon: 38.99, ports: [
      { id: 'SY_LATAKIA', name: 'Latakia', lat: 35.52, lon: 35.77 }
    ] },
    { code: 'TG', nameEs: 'Togo', nameEn: 'Togo', lat: 8.62, lon: 0.82, ports: [
      { id: 'TG_LOME', name: 'Lomé', lat: 6.13, lon: 1.29 }
    ] },
    { code: 'TH', nameEs: 'Tailandia', nameEn: 'Thailand', lat: 15.87, lon: 100.99, ports: [
      { id: 'TH_LAEMCHABANG', name: 'Laem Chabang', lat: 13.08, lon: 100.89 },
      { id: 'TH_BANGKOK', name: 'Bangkok', lat: 13.7, lon: 100.57 }
    ] },
    { code: 'TL', nameEs: 'Timor Oriental', nameEn: 'Timor-Leste', lat: -8.87, lon: 125.73, ports: [
      { id: 'TL_DILI', name: 'Dili', lat: -8.55, lon: 125.58 }
    ] },
    { code: 'TN', nameEs: 'Túnez', nameEn: 'Tunisia', lat: 33.89, lon: 9.54, ports: [
      { id: 'TN_RADES', name: 'Radès', lat: 36.79, lon: 10.28 },
      { id: 'TN_SFAX', name: 'Sfax', lat: 34.73, lon: 10.77 }
    ] },
    { code: 'TR', nameEs: 'Turquía', nameEn: 'Turkey', lat: 38.96, lon: 35.24, ports: [
      { id: 'TR_AMBARLI', name: 'Ambarlı', lat: 40.97, lon: 28.68 },
      { id: 'TR_MERSIN', name: 'Mersin', lat: 36.79, lon: 34.63 },
      { id: 'TR_ALIAGA', name: 'Esmirna (Aliağa)', lat: 38.8, lon: 26.97 }
    ] },
    { code: 'TT', nameEs: 'Trinidad y Tobago', nameEn: 'Trinidad and Tobago', lat: 10.69, lon: -61.22, ports: [
      { id: 'TT_PORTOFSPAIN', name: 'Puerto España', lat: 10.65, lon: -61.52 }
    ] },
    { code: 'TW', nameEs: 'Taiwán', nameEn: 'Taiwan', lat: 23.7, lon: 120.96, ports: [
      { id: 'TW_KAOHSIUNG', name: 'Kaohsiung', lat: 22.6, lon: 120.3 },
      { id: 'TW_KEELUNG', name: 'Keelung', lat: 25.15, lon: 121.74 }
    ] },
    { code: 'TZ', nameEs: 'Tanzania', nameEn: 'Tanzania', lat: -6.37, lon: 34.89, ports: [
      { id: 'TZ_DARESSALAAM', name: 'Dar es Salaam', lat: -6.82, lon: 39.3 }
    ] },
    { code: 'UA', nameEs: 'Ucrania', nameEn: 'Ukraine', lat: 48.38, lon: 31.17, ports: [
      { id: 'UA_ODESA', name: 'Odesa', lat: 46.49, lon: 30.74 }
    ] },
    { code: 'UY', nameEs: 'Uruguay', nameEn: 'Uruguay', lat: -32.52, lon: -55.77, ports: [
      { id: 'UY_MONTEVIDEO', name: 'Montevideo', lat: -34.9, lon: -56.2 }
    ] },
    { code: 'VE', nameEs: 'Venezuela', nameEn: 'Venezuela', lat: 6.42, lon: -66.59, ports: [
      { id: 'VE_PUERTOCABELLO', name: 'Puerto Cabello', lat: 10.47, lon: -68.02 },
      { id: 'VE_LAGUAIRA', name: 'La Guaira', lat: 10.6, lon: -66.93 }
    ] },
    { code: 'VN', nameEs: 'Vietnam', nameEn: 'Vietnam', lat: 14.06, lon: 108.28, ports: [
      { id: 'VN_CAIMEP', name: 'Cai Mep', lat: 10.53, lon: 107.02 },
      { id: 'VN_HAIPHONG', name: 'Haiphong', lat: 20.86, lon: 106.72 }
    ] },
    { code: 'YE', nameEs: 'Yemen', nameEn: 'Yemen', lat: 15.55, lon: 48.52, ports: [
      { id: 'YE_ADEN', name: 'Adén', lat: 12.79, lon: 44.98 }
    ] },
    { code: 'ZA', nameEs: 'Sudáfrica', nameEn: 'South Africa', lat: -30.56, lon: 22.94, ports: [
      { id: 'ZA_DURBAN', name: 'Durban', lat: -29.87, lon: 31.02 },
      { id: 'ZA_CAPETOWN', name: 'Ciudad del Cabo', lat: -33.9, lon: 18.43 },
      { id: 'ZA_NGQURA', name: 'Ngqura', lat: -33.81, lon: 25.68 }
    ] }
  ];

  const norm = (s) => String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

  /* Natural Earth (world-atlas countries-110m) writes several country names
     differently from ISO short names — map those spellings onto our codes. */
  const ALIASES = {
    'United States of America': 'US', 'Dem. Rep. Congo': 'CD', 'Congo': 'CG',
    'Republic of Congo': 'CG', 'Ivory Coast': 'CI', 'Cote dIvoire': 'CI',
    'Dominican Rep.': 'DO', 'Bosnia and Herz.': 'BA', 'Solomon Is.': 'SB',
    'Eq. Guinea': 'GQ', 'Korea': 'KR', 'Republic of Korea': 'KR',
    'Papua New Guinea': 'PG', 'Trinidad and Tobago': 'TT', 'Türkiye': 'TR',
    'Turkiye': 'TR', 'Timor-Leste': 'TL', 'East Timor': 'TL',
    'Cape Verde': 'CV', 'Antigua and Barb.': 'AG', 'Curaçao': 'CW',
    'Great Britain': 'GB', 'England': 'GB', 'Russian Federation': 'RU',
    'Viet Nam': 'VN', 'Syrian Arab Republic': 'SY', 'Iran (Islamic Rep.)': 'IR',
    'Tanzania, United Rep.': 'TZ', 'Brunei Darussalam': 'BN', 'Myanmar (Burma)': 'MM',
    'Burma': 'MM', 'Saint Lucia': 'LC', 'St. Lucia': 'LC', 'Czechia': null
  };

  const byName = {};
  C.forEach((c) => {
    byName[norm(c.nameEn)] = c.code;
    byName[norm(c.nameEs)] = c.code;
  });
  Object.keys(ALIASES).forEach((k) => { if (ALIASES[k]) byName[norm(k)] = ALIASES[k]; });

  const byCode = {};
  C.forEach((c) => { byCode[c.code] = c; });

  window.MARITIME_COUNTRIES = C;
  window.MARITIME_BY_CODE = byCode;
  window.MARITIME_CODE_BY_NAME = byName;
  window.maritimeNorm = norm;
})();
