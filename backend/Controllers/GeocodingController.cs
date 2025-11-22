using Microsoft.AspNetCore.Mvc;
using QlnppApi.Services;

namespace QlnppApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GeocodingController : ControllerBase
    {
        private readonly PlusCodeService _plusCodeService;

        public GeocodingController()
        {
            _plusCodeService = new PlusCodeService();
        }

        /// <summary>
        /// Decodes a Plus Code to coordinates
        /// </summary>
        /// <param name="plusCode">The Plus Code to decode (e.g., "6X6V+QHW")</param>
        /// <param name="refLat">Optional reference latitude for short codes</param>
        /// <param name="refLng">Optional reference longitude for short codes</param>
        /// <returns>Latitude and longitude coordinates</returns>
        [HttpGet("decode-pluscode")]
        public IActionResult DecodePlusCode(
            [FromQuery] string plusCode, 
            [FromQuery] double? refLat = null, 
            [FromQuery] double? refLng = null)
        {
            if (string.IsNullOrWhiteSpace(plusCode))
            {
                return BadRequest(new { error = "Plus Code is required" });
            }

            var coordinates = _plusCodeService.DecodePlusCode(plusCode, refLat, refLng);

            if (coordinates == null)
            {
                return BadRequest(new { error = "Invalid Plus Code format or unable to decode" });
            }

            return Ok(new
            {
                latitude = coordinates.Latitude,
                longitude = coordinates.Longitude,
                plusCode = plusCode,
                success = true
            });
        }

        /// <summary>
        /// Parse various coordinate formats
        /// </summary>
        /// <param name="input">Input string containing coordinates or Plus Code</param>
        /// <returns>Parsed coordinates</returns>
        [HttpGet("parse-coordinates")]
        public IActionResult ParseCoordinates([FromQuery] string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return BadRequest(new { error = "Input is required" });
            }

            // Try direct coordinates first (lat,lng)
            var coordMatch = System.Text.RegularExpressions.Regex.Match(
                input, @"(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)");
            
            if (coordMatch.Success)
            {
                if (double.TryParse(coordMatch.Groups[1].Value, out double lat) &&
                    double.TryParse(coordMatch.Groups[2].Value, out double lng))
                {
                    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
                    {
                        return Ok(new
                        {
                            latitude = lat,
                            longitude = lng,
                            source = "direct_coordinates",
                            success = true
                        });
                    }
                }
            }

            // Try Plus Code
            var plusCodeMatch = System.Text.RegularExpressions.Regex.Match(
                input, @"\b([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{0,})\b",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            if (plusCodeMatch.Success)
            {
                var coordinates = _plusCodeService.DecodePlusCode(plusCodeMatch.Groups[1].Value);
                if (coordinates != null)
                {
                    return Ok(new
                    {
                        latitude = coordinates.Latitude,
                        longitude = coordinates.Longitude,
                        plusCode = plusCodeMatch.Groups[1].Value,
                        source = "plus_code",
                        success = true
                    });
                }
            }

            return BadRequest(new { error = "Unable to parse coordinates from input" });
        }
    }
}
