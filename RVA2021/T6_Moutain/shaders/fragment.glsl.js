const shader =
`
// constant values
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D tex4;
uniform sampler2D tex5;
uniform float mapScale;
uniform float brightness;
uniform vec3 lightDirection;

// interpolated from vertex shader
varying vec2 vUV;
varying float vAmount;
varying vec3 vNormal;

void main()
{
	// draw textures based on the current height
	vec4 t1 = (smoothstep(0.01, 0.25, vAmount) - smoothstep(0.20, 0.30, vAmount)) * texture2D( tex1, vUV * (mapScale * 2.0 ));
	vec4 t2 = (smoothstep(0.20, 0.40, vAmount) - smoothstep(0.35, 0.45, vAmount)) * texture2D( tex2, vUV * (mapScale       ));
	vec4 t3 = (smoothstep(0.35, 0.50, vAmount) - smoothstep(0.45, 0.55, vAmount)) * texture2D( tex3, vUV * (mapScale       ));
	vec4 t4 = (smoothstep(0.45, 0.55, vAmount) - smoothstep(0.50, 0.60, vAmount)) * texture2D( tex4, vUV * (mapScale       ));
	vec4 t5 = (smoothstep(0.50, 0.60, vAmount))                                   * texture2D( tex5, vUV * (mapScale * 2.0 ));
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0) + t1 + t2 + t3 + t4 + t5;

	// apply diffuse shadows
	vec3 n = vNormal * 2.0 - 1.0; // correction due to how normal value is passed
	gl_FragColor.rgb *= max(dot(-lightDirection, n), 0.0) * abs(brightness);
}
`
export default shader
