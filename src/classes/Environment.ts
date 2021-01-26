import { Scene, ShadowGenerator, GlowLayer, HighlightLayer, ParticleSystem, PushMaterial, Vector2, Quaternion, Vector3,PBRMaterial, Mesh,StandardMaterial, Texture, Color4, Color3, CubeTexture, Sound, SceneLoader, MeshBuilder, AssetsManager } from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";

export class Environment {
  private _scene: Scene;
  private _shadowGenerator;
  private _env;
  private _ground;
  private _allMeshes;
  private _playerPoint;
  private _runAfterLoaded: Function;
  private _saveParticleSystem;
  private _highlightLayer;
  private _waterMaterial;
  private _animals;

  constructor(scene: Scene, shadow: ShadowGenerator) {
    this._scene = scene;
    this._shadowGenerator = shadow;
    this._highlightLayer = new HighlightLayer("highlightEnv", this._scene);
    this._animals = [];

    SceneLoader.ImportMesh("", "./assets/models/", "firstLevel.glb", this._scene, this._setEnvironment.bind(this));
  }

  public setActionAfterLoaded(func: Function) {
    this._runAfterLoaded = func;
  }

  private _setEnvironment (newMeshes, particleSystems, skeletons, animationGroups) {
    this._env = newMeshes[0];
    this._env.position.y = 0;


    // test water
    var water = Mesh.CreateGround("water", 25, 25, 32, this._scene);
    this._waterMaterial = new WaterMaterial("water_material", this._scene);
    this._waterMaterial.bumpTexture = new Texture("../assets/textures/waterbump.png", this._scene);
    this._waterMaterial.windForce = -10;
    this._waterMaterial.waveHeight = 0.1;
    this._waterMaterial.bumpHeight = 0.05;
    this._waterMaterial.waveLength = 0.1;
    this._waterMaterial.waveSpeed = 10.0;
    this._waterMaterial.colorBlendFactor = 0;
    this._waterMaterial.windDirection = new Vector2(1, 1);
    this._waterMaterial.colorBlendFactor = 0
    water.material = this._waterMaterial;
    water.position = new Vector3(-2,0,-3);




    /*const axis = new Vector3(0, 1, 0);
    const angle = -Math.PI / 4;
    const quaternion = new Quaternion.RotationAxis(axis, angle);
    this._env.rotationQuaternion = quaternion;*/

    //this._env.checkCollisions = true;

    this._allMeshes = this._env.getChildMeshes();

    //this._env.checkCollisions = true;
    //this._env.isPickable = true;
    this._env.receiveShadows = true;

    this._allMeshes.forEach(mesh => {
      mesh.receiveShadows = true;


      if (mesh.name === 'Plane') {
          this._ground = mesh;
      }

      if (mesh.name === 'player') {
        console.log('Player point was found');
        mesh.isVisible = false;
        this._playerPoint = new Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
      }

      if (mesh.name.includes('tree')) {
        mesh.isPickable = true;
        if (mesh.name.includes('active')) {
          mesh.isActiveItem = true;
        }
      }

      if (mesh.name.includes('treecollider')) {
          mesh.isVisible = false;
          mesh.isPickable = true;
          mesh.isActiveItem = true;
      }

      mesh.checkCollisions = true;
      mesh.isPickable = true;

      if (mesh.name.includes('wall'))  {
        mesh.isVisible = false;
        mesh.isPickable = true;
        mesh.checkCollisions = true;
      }

      if (mesh.name.includes('animal')) {
        console.log("animal position was found");
        mesh.isVisible = false;
        mesh.isPickable = true;
        mesh.checkCollisions = true;
        const invertPosition = new Vector3(-mesh.position.x, mesh.position.y, mesh.position.z);
        this._animals.push({
          name: mesh.name,
          mesh: mesh,
          position: invertPosition,
          isDead: false
        });
      }


      if(mesh.name.includes("Cube")) {
        mesh.isPickable = true;
        mesh.checkCollisions = true;
      }

      if(mesh.name.includes("laboratory")) {
        mesh.isPickable = true;
        mesh.checkCollisions = true;
      }


      if (mesh.name === 'Plane' || mesh.name === 'ground' || mesh.name === 'roud') {
          mesh.isPickable = false;
          mesh.checkCollisions = true;
          this._waterMaterial.addToRenderList(mesh);
      }


      if (mesh.name.includes('Cube') || mesh.name.includes('tree') || mesh.name.includes('Stone') || mesh.name.includes('savestation')) {
        this._shadowGenerator.getShadowMap().renderList.push(mesh);
        mesh.receiveShadows = false;

        if (mesh.name.includes('savestation')) {
          const glowStation = new GlowLayer("glowStation", this._scene, { mainTextureSamples: 2 });
          this._createSaveStationParticles(mesh);
        }

      }


      if (mesh.name.includes('grass')) {
        const mat = new StandardMaterial("grass", this._scene);
        mat.diffuseTexture = new Texture("./assets/textures/grass.png", this._scene);
        mat.diffuseColor = new Color3(1,1,1);
        mat.diffuseTexture.hasAlpha = true;
        mat.backFaceCulling = false;
        mesh.material = mat;
        mesh.receiveShadows = false;
        mesh.checkCollisions = false;
        mesh.isPickable = false;
      }
    });

    this._runAfterLoaded();

  }

  public getMesh() {
    return this._env;
  }

  public getAllMeshes() {
    return this._allMeshes;
  }

  public getGround() {
    return this._ground;
  }

  public getPlayerPoint() {
    return this._playerPoint;
  }

  public getAnimals() {
    return this._animals;
  }



  private _createSaveStationParticles(mesh) {
    this._saveParticleSystem = new ParticleSystem("save_particles", 2000, this._scene);
    this._saveParticleSystem.particleTexture = new Texture("../assets/textures/flare.png", this._scene);
    this._saveParticleSystem.emitter = mesh;
    this._saveParticleSystem.minEmitBox = new Vector3(-1, 0, 0);
    this._saveParticleSystem.maxEmitBox = new Vector3(1, 0, 0);

    this._saveParticleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
    this._saveParticleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    this._saveParticleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

    // Size of each particle (random between...
    this._saveParticleSystem.minSize = 0.1;
    this._saveParticleSystem.maxSize = 0.5;

    // Life time of each particle (random between...
    this._saveParticleSystem.minLifeTime = 0.3;
    this._saveParticleSystem.maxLifeTime = 1.5;

    // Emission rate
    this._saveParticleSystem.emitRate = 1500;

    // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    this._saveParticleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

    // Set the gravity of all particles
    this._saveParticleSystem.gravity = new Vector3(0, -9.81, 0);

    // Direction of each particle after it has been emitted
    this._saveParticleSystem.direction1 = new Vector3(-7, 8, 3);
    this._saveParticleSystem.direction2 = new Vector3(7, 8, -3);

    // Angular speed, in radians
    this._saveParticleSystem.minAngularSpeed = 0;
    this._saveParticleSystem.maxAngularSpeed = Math.PI;

    // Speed
    this._saveParticleSystem.minEmitPower = 1;
    this._saveParticleSystem.maxEmitPower = 3;
    this._saveParticleSystem.updateSpeed = 0.005;
  }

  public startSaveParticles() {
    this._saveParticleSystem.start();
    setTimeout(() => {
      this._saveParticleSystem.stop();
    }, 500);
  }

  public addMeshToHighlight(meshName) {
    const mesh = this._scene.getMeshByName(meshName);
    this._highlightLayer.addMesh(mesh, Color3.Green());
  }

  public removeMeshToHighlight(meshName) {
    this._highlightLayer.removeAllMeshes();
  }


  public addToWaterRender(mesh) {
    this._waterMaterial.addToRenderList(mesh);
  }
}
