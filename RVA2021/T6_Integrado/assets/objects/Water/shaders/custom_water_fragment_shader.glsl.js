const fragmentShader = 
`
uniform sampler2D reflectionSampler;
// uniform sampler2D refractionSampler;

uniform float alpha;
uniform float time;
uniform float size;

uniform float distortionScale;

uniform sampler2D normalSampler;

uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform vec3 eye;
uniform vec3 waterColor;

varying vec3 vvnormal;

varying vec4 mirrorCoord;
varying vec4 worldPosition;
varying vec4 projectedPosition;

// https://29a.ch/slides/2012/webglwater/#slide-27
vec4 getNoise(vec2 uv)
{
    vec2 uv0 = (uv / 103.0) + vec2(time / 17.0, time / 29.0);
    vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0);
    vec2 uv2 = uv / vec2(890.70, 980.30) + vec2(time / 101.0, time / 97.0);
    vec2 uv3 = uv / vec2(1091.0, 1027.0) - vec2(time / 109.0, time / -113.0);
    
    vec4 noise = 
    texture2D(normalSampler, uv0) +
    texture2D(normalSampler, uv1) +
    texture2D(normalSampler, uv2) +
    texture2D(normalSampler, uv3);

    return noise * 0.5 - 1.0;
}

// https://29a.ch/slides/2012/webglwater/#lighting
void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse,
    inout vec3 diffuseColor, inout vec3 specularColor)
{
    vec3 reflection = normalize( reflect(-sunDirection, surfaceNormal) );
    float direction = max( 0.0, dot(eyeDirection, reflection) );
    specularColor += pow(abs(direction), shiny) * sunColor * spec;
    diffuseColor += max( dot(sunDirection, surfaceNormal), 0.0 ) * sunColor * diffuse;
}

#include <common>
#include <packing>
#include <bsdfs>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

void main() {
    #include <logdepthbuf_fragment>

    //***************************
    //******** Lighting *********
    //***************************
    vec4 noise = getNoise( worldPosition.xz );

    vec3 surfaceNormal = normalize( noise.xzy * vec3( 2.0, 1.0, 2.0 ) );

    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);

    vec3 worldToEye = eye - worldPosition.xyz;
    vec3 eyeDirection = normalize( worldToEye );

    sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

    //***************************
    //**** Reflection Shader ****
    //***************************
    float distance = length(worldToEye);
    
    vec2 screen = (mirrorCoord.xy / mirrorCoord.w + 1.0) * 0.5;

    float distortionFactor = max(distance/100.0, 10.0);
    vec2 distortion = surfaceNormal.xz / distortionFactor;

    // vec3 reflectionSample = vec3( texture2D( reflectionSampler, screen + distortion) );
    vec3 reflectionSample = vec3( texture2D( reflectionSampler, mirrorCoord.xy / mirrorCoord.w + distortion) );

    //**************************************** 
    //**** Fresnel-Schlicks Approximation ****
    //****************************************
    float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
    float rf0 = 0.2;
    float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );


    //***************************
    //******** Scattering *******
    //***************************
    vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
    

    //***************************
    //******** Refraction *******
    //***************************
    // vec3 refractionSample = vec3( texture2D( reflectionSampler, screen - distortion) );
    vec3 refractionSample = vec3( texture2D( reflectionSampler, mirrorCoord.xy / mirrorCoord.w - distortion) );
    
    //***************************
    //******** Absorbtion ********
    //***************************
    float depth = length( worldPosition.xyz - eye );
    float waterDepth = min(refractionSample.z - depth, 40.0);
    vec3 absorbtion = min( (waterDepth / 35.0) * vec3(2.0, 1.05, 1.0), vec3(1.0));
    vec3 refractionColor = mix(vec3(refractionSample) * 0.5, waterColor, absorbtion);

    //***************************
    //******** Albedo *******
    //***************************
    // reflection+refraction albedo:
    vec3 albedo = mix((scatter + (refractionSample * diffuseLight)) * 0.3 , ( vec3( 0.1 ) + reflectionSample * 0.9 + specularLight), reflectance );

    gl_FragColor = vec4( albedo, alpha);

    #include <tonemapping_fragment>
    #include <fog_fragment>
}
`

export default fragmentShader