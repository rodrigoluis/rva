const shader =
`
// constant values
uniform sampler2D bumpTexture;
uniform sampler2D normalTexture;
uniform float bumpScale;

// to be interpolated in fragment shader
varying float vAmount;
varying vec2 vUV;
varying vec3 vNormal;

void main()
{
	vUV = uv;
	vec4 bumpData = texture2D(bumpTexture, uv);
	vec4 normalData = texture2D(normalTexture, uv);
	vAmount = bumpData.r;

	// get normal data from file in texture format
	vNormal = vec3(normalData.r, normalData.g, normalData.b);

	// move the position along the normal
    vec3 newPosition = position + normal * bumpScale * vAmount;

	// update real position
	gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`
export default shader;
