import {
    Color,
    FrontSide,
    DoubleSide,
    LinearFilter,
    MathUtils,
    Matrix4,
    Mesh,
    PerspectiveCamera,
    Plane,
    RGBFormat,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector3,
    Vector4,
    WebGLRenderTarget
} from '../../../../build/three.module.js';

import CustomWavesFragment from './shaders/custom_water_fragment_shader.glsl.js';
import DefaultWavesFragment from './shaders/default_water_fragment_shader.glsl.js';

import WavesVertex from './shaders/custom_water_vertex_shader.glsl.js';
import DefaultWavesVertex from './shaders/default_water_vertex_shader.glsl.js';
import { getCoefficientsTexture } from './utils/coefficients.js';

let Waves = function(geometry, options = {})
{
    Mesh.call(this, geometry);
    let scope = this;

    // Water Parameters
    let textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512;
    let textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512;
    let clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
    let alpha = options.alpha !== undefined ? options.alpha : 1.0;
    let time = options.time !== undefined ? options.time : 0.0;
    let normalSampler = options.waterNormals !== undefined ? options.waterNormals : null;
    let sunDirection = options.sunDirection !== undefined ? options.sunDirection : new Vector3(0.70707, 0.70707, 0.0);
    let sunColor = new Color(options.sunColor !== undefined ? options.sunColor : 0xffffff);
    let waterColor = new Color(options.waterColor !== undefined ? options.waterColor : 0x7F7F7F);
    let eye = options.eye !== undefined ? options.eye : new Vector3(0, 0, 0);
    const distortionScale = options.distortionScale !== undefined ? options.distortionScale : 20.0;
    let side = options.side !== undefined ? options.side : FrontSide;
    let fog = options.fog !== undefined ? options.fog : false;

    // Gerstner Waves Parameters
    let direction = options.direction !== undefined ? options.direction : 0.0;
    let frequency = options.frequency !== undefined ? options.frequency : 0.05;
    let amplitude = options.amplitude !== undefined ? options.amplitude : 20.0;
    let steepness = options.steepness !== undefined ? options.steepness : 1.0;
    let speed = options.speed !== undefined ? options.speed : 1.0;
    let manyWaves = options.manyWaves !== undefined ? options.manyWaves : false;

    
    // Global variables
    let mirrorPlane = new Plane();
    let normal = new Vector3();
    let mirrorWorldPosition = new Vector3();
    let cameraWorldPosition = new Vector3();
    let lookAtPosition = new Vector3(0, 0, -1);
    let view = new Vector3();
    let target = new Vector3();
    let clipPlane = new Vector4();
    let q = new Vector4();
    let rotationMatrix = new Matrix4();
    let textureMatrix = new Matrix4();
    let mirrorCamera = new PerspectiveCamera();

    
    let parameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBFormat,
        stencilBuffer: true
    };

    let renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, parameters);
    if (!MathUtils.isPowerOfTwo(textureWidth) || !MathUtils.isPowerOfTwo(textureHeight))
        renderTarget.texture.generateMipmaps = false;

    let coefficientTexture = getCoefficientsTexture();

    let mirrorShader =
    {
        uniforms: UniformsUtils.merge([
            UniformsLib.fog,
            UniformsLib.lights,
            {
                normalSampler: { value: null },
                reflectionSampler: { value: null },
                // refractionSampler: { value: null },
                alpha: { value: 1.0 },
                time: { value: 0.0 },
                size: { value: 1.0 },//2.7
                distortionScale: { value: 20.0 },
                textureMatrix: { value: new Matrix4() },
                sunColor: { value: new Color( 0x7F7F7F ) },
                sunDirection: { value: new Vector3( 0.70707, 0.70707, 0 ) },
                eye: { value: new Vector3() },
                waterColor: { value: new Color( 0x555555 ) },

                // Gerstner Waves
                direction: { value: direction },
                frequency: { value: frequency },
                amplitude: { value: amplitude },
                steepness: { value: steepness },
                speed: { value: speed },
                wavesToAdd: { value: manyWaves },
                coefficientSampler: { value: coefficientTexture },
            }
        ]),

        vertexShader: WavesVertex,
        // vertexShader: DefaultWavesVertex,
        fragmentShader: CustomWavesFragment
        // fragmentShader: BasicWavesFragment
        // fragmentShader: DefaultWavesFragment
    };

    let material = new ShaderMaterial({
        fragmentShader: mirrorShader.fragmentShader,
        vertexShader: mirrorShader.vertexShader,
        uniforms: UniformsUtils.clone(mirrorShader.uniforms),
        lights: true,
        side: side,
        fog: fog,
        transparent: true,
        // wireframe: true
    });

    material.uniforms.reflectionSampler.value = renderTarget.texture;
    // material.uniforms.refractionSampler.value = renderTarget.texture;
    material.uniforms.textureMatrix.value = textureMatrix;
    material.uniforms.alpha.value = alpha;
    material.uniforms.time.value = time;
    material.uniforms.normalSampler.value = normalSampler;
    material.uniforms.sunColor.value = sunColor;
    material.uniforms.waterColor.value = waterColor;
    material.uniforms.sunDirection.value = sunDirection;
    material.uniforms.distortionScale.value = distortionScale;
    material.uniforms.eye.value = eye;

    scope.material = material;

    scope.onBeforeRender = function(renderer, scene, camera)
    {
        mirrorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
        cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
        
        rotationMatrix.extractRotation(scope.matrixWorld);
        
        normal.set(0, 0, 1);
        normal.applyMatrix4(rotationMatrix);
        
        view.subVectors(mirrorWorldPosition, cameraWorldPosition);

        // Avoid rendering when mirror is facing away
        if (view.dot(normal) > 0) return;

        view.reflect(normal).negate();
        view.add(mirrorWorldPosition);

        rotationMatrix.extractRotation(camera.matrixWorld);

        lookAtPosition.set(0, 0, -1);
        lookAtPosition.applyMatrix4(rotationMatrix);
        lookAtPosition.add(cameraWorldPosition);

        target.subVectors(mirrorWorldPosition, lookAtPosition);
        target.reflect(normal).negate();
        target.add(mirrorWorldPosition);

        mirrorCamera.position.copy(view);
        mirrorCamera.up.set(0, 1, 0);
        mirrorCamera.up.applyMatrix4(rotationMatrix);
        mirrorCamera.up.reflect(normal);
        mirrorCamera.lookAt(target);

        mirrorCamera.far = camera.far; // Used in WebGLBackground

        mirrorCamera.updateMatrixWorld();
        mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);

        // Update the texture matrix
        textureMatrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        );
        textureMatrix.multiply(mirrorCamera.projectionMatrix);
        textureMatrix.multiply(mirrorCamera.matrixWorldInverse);

        // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
        // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
        // https://29a.ch/slides/2012/webglwater/#slide-43
        // Oblique clipping (is it useful on deformed geometries?)
        mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition);
        mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);

        clipPlane.set(mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant);
        
        let projectionMatrix = mirrorCamera.projectionMatrix;
        
        q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        q.z = -1.0;
        q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
        
        // Calculate the scaled plane vector
        clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

        // Replacing the third row of the projection matrix
        projectionMatrix.elements[2] = clipPlane.x;
        projectionMatrix.elements[6] = clipPlane.y;
        projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
        // projectionMatrix.elements[10] = clipPlane.z + 1.0;
        projectionMatrix.elements[14] = clipPlane.w;
        eye.setFromMatrixPosition(camera.matrixWorld);

        // Render
        let currentRenderTarget = renderer.getRenderTarget();
        
        // Save
        let currentXrEnabled = renderer.xr.enabled;
        let currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

        scope.visible = false;

        renderer.xr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        renderer.setRenderTarget(renderTarget);

        renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897
        
        if (renderer.autoClear === false) renderer.clear();
        renderer.render(scene, mirrorCamera);

        // Restore
        scope.visible = true;

        renderer.xr.enabled = currentXrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

        renderer.setRenderTarget(currentRenderTarget);

        // Restore viewport
        let viewport = camera.viewport;
        if (viewport !== undefined) {
            renderer.state.viewport(viewport);
        }
    };
};

Waves.prototype = Object.create(Mesh.prototype);
Waves.prototype.constructor = Waves;

export { Waves };