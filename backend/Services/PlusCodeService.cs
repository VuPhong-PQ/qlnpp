using System;
using System.Text.RegularExpressions;

namespace QlnppApi.Services
{
    public class PlusCodeService
    {
        private const string CodeAlphabet = "23456789CFGHJMPQRVWX";
        private const int PairCodeLength = 10;
        private const int GridRows = 5;
        private const int GridColumns = 4;

        public class Coordinates
        {
            public double Latitude { get; set; }
            public double Longitude { get; set; }
        }

        /// <summary>
        /// Decodes a Plus Code (Open Location Code) to coordinates
        /// </summary>
        public Coordinates? DecodePlusCode(string plusCode, double? refLat = null, double? refLng = null)
        {
            if (string.IsNullOrWhiteSpace(plusCode))
                return null;

            // Clean up
            plusCode = plusCode.Trim().ToUpper().Replace(" ", "");

            var match = Regex.Match(plusCode, @"^([23456789CFGHJMPQRVWX]{2,8})\+([23456789CFGHJMPQRVWX]{0,})$");
            if (!match.Success)
                return null;

            string prefix = match.Groups[1].Value;
            string suffix = match.Groups[2].Value;

            // Pad prefix to 8 characters if it's a short code
            if (prefix.Length < 8)
            {
                if (refLat == null || refLng == null)
                {
                    // Default reference for Southeast Asia/Vietnam
                    refLat = 10.2;
                    refLng = 103.9;
                }

                // Compute prefix from reference location
                int paddingLength = 8 - prefix.Length;
                string refPrefix = EncodeLatLng(refLat.Value, refLng.Value, paddingLength);
                prefix = refPrefix + prefix;
            }

            if (prefix.Length != 8)
                return null;

            // Decode pairs (20-degree blocks progressively subdivided)
            double lat = -90.0;
            double lng = -180.0;
            double latResolution = 20.0;
            double lngResolution = 20.0;

            for (int i = 0; i < 8; i += 2)
            {
                int latDigit = CodeAlphabet.IndexOf(prefix[i]);
                int lngDigit = CodeAlphabet.IndexOf(prefix[i + 1]);

                if (latDigit < 0 || lngDigit < 0)
                    return null;

                lat += latDigit * latResolution;
                lng += lngDigit * lngResolution;

                latResolution /= 20.0;
                lngResolution /= 20.0;
            }

            // Decode grid refinement (after the +)
            if (suffix.Length > 0)
            {
                // Each character in suffix represents a position in a 5x4 grid
                double gridLatSize = latResolution * GridRows;
                double gridLngSize = lngResolution * GridColumns;

                for (int i = 0; i < suffix.Length; i++)
                {
                    int digit = CodeAlphabet.IndexOf(suffix[i]);
                    if (digit < 0) break;

                    int row = digit / GridColumns;
                    int col = digit % GridColumns;

                    lat += row * gridLatSize / GridRows;
                    lng += col * gridLngSize / GridColumns;

                    gridLatSize /= GridRows;
                    gridLngSize /= GridColumns;
                }
            }

            // Return center of cell
            lat += latResolution / 2.0;
            lng += lngResolution / 2.0;

            if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
                return null;

            return new Coordinates
            {
                Latitude = Math.Round(lat, 7),
                Longitude = Math.Round(lng, 7)
            };
        }

        /// <summary>
        /// Encode lat/lng to Plus Code prefix
        /// </summary>
        private string EncodeLatLng(double lat, double lng, int length)
        {
            lat = Math.Max(-90, Math.Min(90, lat)) + 90;
            lng = Math.Max(-180, Math.Min(180, lng)) + 180;

            string code = "";
            double latResolution = 400.0; // 20^4
            double lngResolution = 400.0;

            // Compute 4 pairs (8 characters)
            for (int i = 0; i < 4; i++)
            {
                int latDigit = (int)(lat / latResolution);
                int lngDigit = (int)(lng / lngResolution);

                if (latDigit >= 20) latDigit = 19;
                if (lngDigit >= 20) lngDigit = 19;

                code += CodeAlphabet[latDigit];
                code += CodeAlphabet[lngDigit];

                lat -= latDigit * latResolution;
                lng -= lngDigit * lngResolution;

                latResolution /= 20.0;
                lngResolution /= 20.0;
            }

            // Return only the requested prefix length
            return code.Substring(0, Math.Min(length, code.Length));
        }
    }
}
