/*
 * Copyright (c) 2013 Google, Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgment in the product documentation would be
 * appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 * misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

// #if B2_ENABLE_PARTICLE

import * as box2d from "../../Box2D/Box2D";
import * as testbed from "../Testbed";

// /**
//  * The following parameters are not static const members of the
//  * Sandbox class with values assigned inline as it can result in
//  * link errors when using gcc.
//  */
// SandboxParams = {};
export class SandboxParams {
  /**
   * Total possible pump squares
   */
  static readonly k_maxPumps: number = 5;
  /**
   * Total possible emitters
   */
  static readonly k_maxEmitters: number = 5;
  /**
   * Number of seconds to push one direction or the other on the
   * pumps
   */
  static readonly k_flipTime: number = 6;
  /**
   * Radius of a tile
   */
  static readonly k_tileRadius: number = 2;
  /**
   * Diameter of a tile
   */
  static readonly k_tileDiameter: number = 4;
  /**
   * Pump radius; slightly smaller than a tile
   */
  static readonly k_pumpRadius: number = 2.0 - 0.05;

  static readonly k_playfieldLeftEdge: number = -20;
  static readonly k_playfieldRightEdge: number = 20;
  static readonly k_playfieldBottomEdge: number = 40;

  /**
   * The world size in the TILE
   */
  static readonly k_tileWidth: number = 10;
  static readonly k_tileHeight: number = 11;

  /**
   * Particles/second
   */
  static readonly k_defaultEmitterRate: number = 30;
  /**
   * Fit cleanly inside one block
   */
  static readonly k_defaultEmitterSize: number = 3;
  /**
   * How fast particles coming out of the particles should drop
   */
  static readonly k_particleExitSpeedY: number = -9.8;
  /**
   * How hard the pumps can push
   */
  static readonly k_pumpForce: number = 600;

  /**
   * Number of *special* particles.
   */
  static readonly k_numberOfSpecialParticles: number = 256;
}


/**
 * Class which tracks a set of particles and applies a special
 * effect to them.
 */
export class SpecialParticleTracker extends box2d.b2DestructionListener {
  /**
   * Set of particle handles used to track special particles.
   */
  m_particles: box2d.b2ParticleHandle[] = [];

  /**
   * Pointer to the world used to enable / disable this class as a
   * destruction listener.
   */
  m_world: box2d.b2World;
  /**
   * Pointer to the particle system used to retrieve particle
   * handles.
   */
  m_particleSystem: box2d.b2ParticleSystem;
  /**
   * Current offset into this.m_colorOscillationPeriod.
   */
  m_colorOscillationTime = 0.0;
  /**
   * Color oscillation period in seconds.
   */
  m_colorOscillationPeriod = 2.0;

  /**
   * @return {void}
   */
  __dtor__(): void {
    this.m_world.SetDestructionListener(null);
  }

  /**
   * Register this class as a destruction listener so that it's
   * possible to keep track of special particles.
   */
  Init(world: box2d.b2World, system: box2d.b2ParticleSystem) {
    box2d.b2Assert(world !== null);
    box2d.b2Assert(system !== null);
    this.m_world = world;
    this.m_particleSystem = system;
    this.m_world.SetDestructionListener(this);
  }

  /**
   * Add as many of the specified particles to the set of special
   * particles.
   */
  Add(particleIndices: number[], numberOfParticles: number) {
    box2d.b2Assert(this.m_particleSystem !== null);
    for (let i = 0; i < numberOfParticles && this.m_particles.length < SandboxParams.k_numberOfSpecialParticles; ++i) {
      const particleIndex = particleIndices[i];
      this.m_particleSystem.SetParticleFlags(particleIndex, this.m_particleSystem.GetFlagsBuffer()[particleIndex] | box2d.b2ParticleFlag.b2_destructionListenerParticle);
      this.m_particles.push(this.m_particleSystem.GetParticleHandleFromIndex(particleIndex));
    }
  }

  /**
   * Apply effects to special particles.
   * @return {void}
   * @param {number} dt
   */
  Step(dt: number): void {
    function fmod(a: number, b: number) {
      return (a - (Math.floor(a / b) * b));
    }
    // Oscillate the shade of color over this.m_colorOscillationPeriod seconds.
    this.m_colorOscillationTime = fmod(this.m_colorOscillationTime + dt,
      this.m_colorOscillationPeriod);
    const colorCoeff = 2.0 * Math.abs(
      (this.m_colorOscillationTime / this.m_colorOscillationPeriod) - 0.5);
    const color = new box2d.b2Color(
      (128 + (128.0 * (1.0 - colorCoeff)) / 255),
      (128 + (256.0 * Math.abs(0.5 - colorCoeff)) / 255),
      (128 + (128.0 * colorCoeff)) / 255, 255 / 255);
    // Update the color of all special particles.
    for (let i = 0; i < this.m_particles.length; ++i) {
      this.m_particleSystem.GetColorBuffer()[this.m_particles[i].GetIndex()].Copy(color);
    }
  }

  SayGoodbyeJoint(joint: box2d.b2Joint): void {}

  SayGoodbyeFixture(fixture: box2d.b2Fixture): void {}

  SayGoodbyeParticleGroup(group: box2d.b2ParticleGroup): void {}

  /**
   * When a particle is about to be destroyed, remove it from the
   * list of special particles as the handle will become invalid.
   */
  SayGoodbyeParticle(particleSystem: box2d.b2ParticleSystem, index: number): void {
    if (particleSystem !== this.m_particleSystem)
      return;

    // NOTE: user data could be used as an alternative method to look up
    // the local handle pointer from the index.
    const length = this.m_particles.length;
    this.m_particles = this.m_particles.filter(function(value) {
      return value.GetIndex() !== index;
    });
    box2d.b2Assert((length - this.m_particles.length) === 1);
  }
}

/**
 * Sandbox test creates a maze of faucets, pumps, ramps,
 * circles, and blocks based on a string constant.  Please
 * modify and play with this string to make new mazes, and also
 * add new maze elements!
 */

export class Sandbox extends testbed.Test {
  /**
   * Count of faucets in the world
   */
  m_faucetEmitterIndex = 0;
  /**
   * Count of pumps in the world
   */
  m_pumpIndex = 0;

  /**
   * How long have we been pushing the pumps?
   */
  m_pumpTimer = 0.0;
  /**
   * Particle creation flags
   */
  m_particleFlags = 0;

  /**
   * Pump force
   */
  m_pumpForce: box2d.b2Vec2;

  /**
   * The shape we will use for the killfield
   */
  m_killFieldShape: box2d.b2PolygonShape;
  /**
   * Transform for the killfield shape
   */
  m_killFieldTransform: box2d.b2Transform;

  /**
   * Pumps and emitters
   */
  m_pumps: box2d.b2Body[];
  m_emitters: testbed.RadialEmitter[];

  /**
   * Special particle tracker.
   */
  m_specialTracker: SpecialParticleTracker;

  static readonly k_paramValues = [
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_waterParticle, testbed.ParticleParameter.k_DefaultOptions, "water"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_waterParticle, testbed.ParticleParameter.k_DefaultOptions | testbed.ParticleParameter.Options.OptionStrictContacts, "water (strict)"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_powderParticle, testbed.ParticleParameter.k_DefaultOptions, "powder"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_tensileParticle, testbed.ParticleParameter.k_DefaultOptions, "tensile"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_viscousParticle, testbed.ParticleParameter.k_DefaultOptions, "viscous"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_tensileParticle | box2d.b2ParticleFlag.b2_powderParticle, testbed.ParticleParameter.k_DefaultOptions, "tensile powder"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_viscousParticle | box2d.b2ParticleFlag.b2_powderParticle, testbed.ParticleParameter.k_DefaultOptions, "viscous powder"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_viscousParticle | box2d.b2ParticleFlag.b2_tensileParticle | box2d.b2ParticleFlag.b2_powderParticle, testbed.ParticleParameter.k_DefaultOptions, "viscous tensile powder"),
    new testbed.ParticleParameter.Value(box2d.b2ParticleFlag.b2_viscousParticle | box2d.b2ParticleFlag.b2_tensileParticle, testbed.ParticleParameter.k_DefaultOptions, "tensile viscous water")
  ];

  static readonly k_paramDef = [
    new testbed.ParticleParameter.Definition(Sandbox.k_paramValues)
  ];
  static readonly k_paramDefCount = Sandbox.k_paramDef.length;

  constructor() {
    super();

    // We need some ground for the pumps to slide against
    const bd = new box2d.b2BodyDef();
    const ground = this.m_world.CreateBody(bd);

    // Reset our pointers
    this.m_emitters = [];
    for (let i = 0; i < SandboxParams.k_maxEmitters; i++) {
      this.m_emitters[i] = null;
    }

    this.m_pumps = [];
    for (let i = 0; i < SandboxParams.k_maxPumps; i++) {
      this.m_pumps[i] = null;
    }

    this.m_world.SetGravity(new box2d.b2Vec2(0.0, -20));

    // Create physical box, no top
    {
      {
        const shape = new box2d.b2PolygonShape();
        const vertices = [
          new box2d.b2Vec2(-40, -10),
          new box2d.b2Vec2(40, -10),
          new box2d.b2Vec2(40, 0),
          new box2d.b2Vec2(-40, 0)
        ];
        shape.Set(vertices, 4);
        ground.CreateFixture(shape, 0.0);
      }

      {
        const shape = new box2d.b2PolygonShape();
        const vertices = [
          new box2d.b2Vec2(SandboxParams.k_playfieldLeftEdge - 20, -1),
          new box2d.b2Vec2(SandboxParams.k_playfieldLeftEdge, -1),
          new box2d.b2Vec2(SandboxParams.k_playfieldLeftEdge, 50),
          new box2d.b2Vec2(SandboxParams.k_playfieldLeftEdge - 20, 50)
        ];
        shape.Set(vertices, 4);
        ground.CreateFixture(shape, 0.0);
      }

      {
        const shape = new box2d.b2PolygonShape();
        const vertices = [
          new box2d.b2Vec2(SandboxParams.k_playfieldRightEdge, -1),
          new box2d.b2Vec2(SandboxParams.k_playfieldRightEdge + 20, -1),
          new box2d.b2Vec2(SandboxParams.k_playfieldRightEdge + 20, 50),
          new box2d.b2Vec2(SandboxParams.k_playfieldRightEdge, 50)
        ];
        shape.Set(vertices, 4);
        ground.CreateFixture(shape, 0.0);
      }
    }

    this.m_particleSystem.SetRadius(0.25);

    this.m_specialTracker = new SpecialParticleTracker();
    this.m_specialTracker.Init(this.m_world, this.m_particleSystem);

    this.m_pumpTimer = 0;

    this.SetupMaze();

    // Create killfield shape and transform
    this.m_killFieldShape = new box2d.b2PolygonShape();
    this.m_killFieldShape.SetAsBox(SandboxParams.k_playfieldRightEdge - SandboxParams.k_playfieldLeftEdge, 1);

    // Put this at the bottom of the world
    this.m_killFieldTransform = new box2d.b2Transform();
    const loc = new box2d.b2Vec2(-20, 1);
    this.m_killFieldTransform.SetPositionAngle(loc, 0);

    // Setup particle parameters.
    testbed.Main.SetParticleParameters(Sandbox.k_paramDef, Sandbox.k_paramDefCount);
    this.m_particleFlags = testbed.Main.GetParticleParameterValue();
    testbed.Main.SetRestartOnParticleParameterChange(false);
  }

  __dtor__() {
    // deallocate our emitters
    for (let i = 0; i < this.m_faucetEmitterIndex; i++) {
      ///  delete this.m_emitters[i];
      this.m_emitters[i] = null;
    }
  }

  // Create a maze of blocks, ramps, pumps, and faucets.
  // The maze is defined in a string; feel free to modify it.
  // Items in the maze include:
  //   # = a block
  //   / = a right-to-left ramp triangle
  //   A = a left-to-right ramp triangle (can't be \ or string formatting
  //       would be weird)
  //   r, g, b = colored faucets pointing down
  //   p = a pump block that rocks back and forth.  You can drag them
  //       yourself with your finger.
  //   C = a loose circle
  //   K = an ignored placeholder for a killfield to remove particles;
  //       entire bottom row is a killfield.
  SetupMaze() {
    const maze =
      "# r#g #r##" +
      "  /#  #  #" +
      " ###     p" +
      "A  #  /###" +
      "## # /#  C" +
      "  /# #   #" +
      " ### # / #" +
      " ## p /#  " +
      " #  ####  " +
      "A        /" +
      "#####KK###";

    box2d.b2Assert(maze.length == SandboxParams.k_tileWidth * SandboxParams.k_tileHeight);

    this.m_faucetEmitterIndex = 0;
    this.m_pumpIndex = 0;

    // Set up some standard shapes/vertices we'll use later.
    const boxShape = new box2d.b2PolygonShape();
    boxShape.SetAsBox(SandboxParams.k_tileRadius, SandboxParams.k_tileRadius);

    ///  b2Vec2 triangle[3];
    const triangle = box2d.b2Vec2.MakeArray(3);
    triangle[0].Set(-SandboxParams.k_tileRadius, -SandboxParams.k_tileRadius);
    triangle[1].Set(SandboxParams.k_tileRadius, SandboxParams.k_tileRadius);
    triangle[2].Set(SandboxParams.k_tileRadius, -SandboxParams.k_tileRadius);
    const rightTriangleShape = new box2d.b2PolygonShape();
    rightTriangleShape.Set(triangle, 3);

    triangle[1].Set(-SandboxParams.k_tileRadius, SandboxParams.k_tileRadius);
    const leftTriangleShape = new box2d.b2PolygonShape();
    leftTriangleShape.Set(triangle, 3);

    // Make these just a touch smaller than a tile
    const circleShape = new box2d.b2CircleShape();
    circleShape.m_radius = SandboxParams.k_tileRadius * 0.7;

    const red = new box2d.b2Color(255/255, 128/255, 128/255, 255/255);
    const green = new box2d.b2Color(128/255, 255/255, 128/255, 255/255);
    const blue = new box2d.b2Color(128/255, 128/255, 255/255, 255/255);

    this.m_pumpForce = new box2d.b2Vec2(SandboxParams.k_pumpForce, 0);

    for (let i = 0; i < SandboxParams.k_tileWidth; i++) {
      for (let j = 0; j < SandboxParams.k_tileHeight; j++) {
        const item = maze[j * SandboxParams.k_tileWidth + i];

        // Calculate center of this square
        const center = new box2d.b2Vec2(
          SandboxParams.k_playfieldLeftEdge + SandboxParams.k_tileRadius * 2 * i + SandboxParams.k_tileRadius,
          SandboxParams.k_playfieldBottomEdge - SandboxParams.k_tileRadius * 2 * j +
          SandboxParams.k_tileRadius);

        // Let's add some items
        switch (item) {
          case '#':
            // Block
            this.CreateBody(center, boxShape, box2d.b2BodyType.b2_staticBody);
            break;
          case 'A':
            // Left-to-right ramp
            this.CreateBody(center, leftTriangleShape, box2d.b2BodyType.b2_staticBody);
            break;
          case '/':
            // Right-to-left ramp
            this.CreateBody(center, rightTriangleShape, box2d.b2BodyType.b2_staticBody);
            break;
          case 'C':
            // A circle to play with
            this.CreateBody(center, circleShape, box2d.b2BodyType.b2_dynamicBody);
            break;
          case 'p':
            this.AddPump(center);
            break;
          case 'b':
            // Blue emitter
            this.AddFaucetEmitter(center, blue);
            break;
          case 'r':
            // Red emitter
            this.AddFaucetEmitter(center, red);
            break;
          case 'g':
            // Green emitter
            this.AddFaucetEmitter(center, green);
            break;
          default:
            // add nothing
            break;
        }
      }
    }
  }

  CreateBody(center: box2d.b2Vec2, shape: box2d.b2Shape, type: box2d.b2BodyType) {
    const def = new box2d.b2BodyDef();
    def.position.Copy(center);
    def.type = type;
    const body = this.m_world.CreateBody(def);
    body.CreateFixture(shape, 10.0);
  }

  // Inititalizes a pump and its prismatic joint, and adds it to the world
  AddPump(center: box2d.b2Vec2) {
    // Don't make too many pumps
    box2d.b2Assert(this.m_pumpIndex < SandboxParams.k_maxPumps);

    const shape = new box2d.b2PolygonShape();
    shape.SetAsBox(SandboxParams.k_pumpRadius, SandboxParams.k_pumpRadius);

    const def = new box2d.b2BodyDef();
    def.position.Copy(center);
    def.type = box2d.b2BodyType.b2_dynamicBody;
    def.angle = 0;
    const body = this.m_world.CreateBody(def);
    body.CreateFixture(shape, 5.0);

    // Create a prismatic joint and connect to the ground, and have it
    // slide along the x axis.
    const prismaticJointDef = new box2d.b2PrismaticJointDef();
    prismaticJointDef.bodyA = this.m_groundBody;
    prismaticJointDef.bodyB = body;
    prismaticJointDef.collideConnected = false;
    prismaticJointDef.localAxisA.Set(1, 0);
    prismaticJointDef.localAnchorA.Copy(center);

    this.m_world.CreateJoint(prismaticJointDef);

    this.m_pumps[this.m_pumpIndex] = body;
    this.m_pumpIndex++;
  }

  // Initializes and adds a faucet emitter
  AddFaucetEmitter(center: box2d.b2Vec2, color: box2d.b2Color) {
    // Don't make too many emitters
    box2d.b2Assert(this.m_faucetEmitterIndex < SandboxParams.k_maxPumps);

    const startingVelocity = new box2d.b2Vec2(0, SandboxParams.k_particleExitSpeedY);

    const emitter = new testbed.RadialEmitter();
    emitter.SetParticleSystem(this.m_particleSystem);
    emitter.SetPosition(center);
    emitter.SetVelocity(startingVelocity);
    emitter.SetSize(new box2d.b2Vec2(SandboxParams.k_defaultEmitterSize, 0.0));
    emitter.SetEmitRate(SandboxParams.k_defaultEmitterRate);
    emitter.SetColor(color);
    this.m_emitters[this.m_faucetEmitterIndex] = emitter;
    this.m_faucetEmitterIndex++;
  }

  JointDestroyed(joint: box2d.b2Joint): void {
    super.JointDestroyed(joint);
  }

  ParticleGroupDestroyed(group: box2d.b2ParticleGroup): void {
    super.ParticleGroupDestroyed(group);
  }

  BeginContact(contact: box2d.b2Contact): void {
    super.BeginContact(contact);
  }

  EndContact(contact: box2d.b2Contact): void {
    super.EndContact(contact);
  }

  /**
   * @export
   * @return {void}
   * @param {box2d.b2Contact} contact
   * @param {box2d.b2Manifold} oldManifold
   */
  PreSolve(contact: box2d.b2Contact, oldManifold: box2d.b2Manifold): void {
    super.PreSolve(contact, oldManifold);
  }

  /**
   * @export
   * @return {void}
   * @param {box2d.b2Contact} contact
   * @param {box2d.b2ContactImpulse} impulse
   */
  PostSolve(contact: box2d.b2Contact, impulse: box2d.b2ContactImpulse): void {
    super.PostSolve(contact, impulse);
  }

  /**
   * Allows you to set particle flags on devices with keyboards
   */
  Keyboard(key: string): void {
    super.Keyboard(key);
    let toggle = 0;
    switch (key) {
      case "a":
        this.m_particleFlags = 0;
        break;
      case "q":
        toggle = box2d.b2ParticleFlag.b2_powderParticle;
        break;
      case "t":
        toggle = box2d.b2ParticleFlag.b2_tensileParticle;
        break;
      case "v":
        toggle = box2d.b2ParticleFlag.b2_viscousParticle;
        break;
      case "w":
        toggle = box2d.b2ParticleFlag.b2_wallParticle;
        break;
    }
    if (toggle) {
      if (this.m_particleFlags & toggle) {
        this.m_particleFlags = this.m_particleFlags & ~toggle;
      } else {
        this.m_particleFlags = this.m_particleFlags | toggle;
      }
    }
    testbed.Main.SetParticleParameterValue(this.m_particleFlags);
  }

  KeyboardUp(key: string): void {
    super.KeyboardUp(key);
  }

  MouseDown(p: box2d.b2Vec2): void {
    super.MouseDown(p);
  }

  MouseUp(p: box2d.b2Vec2): void {
    super.MouseUp(p);
  }

  MouseMove(p: box2d.b2Vec2): void {
    super.MouseMove(p);
  }

  /**
   * Per-frame step updater overridden from Test
   */
  Step(settings: testbed.Settings): void {
    super.Step(settings);

    this.m_particleFlags = testbed.Main.GetParticleParameterValue();

    const dt = 1.0 / settings.hz;

    // Step all the emitters
    for (let i = 0; i < this.m_faucetEmitterIndex; i++) {
      const particleIndices: number[] = [];
      const emitter = this.m_emitters[i];

      emitter.SetParticleFlags(this.m_particleFlags);
      const particlesCreated = emitter.Step(dt, particleIndices, SandboxParams.k_numberOfSpecialParticles);
      this.m_specialTracker.Add(particleIndices, particlesCreated);
    }

    // Step the special tracker.
    this.m_specialTracker.Step(dt);

    // Do killfield work--kill every particle near the bottom of the screen
    this.m_particleSystem.DestroyParticlesInShape(this.m_killFieldShape, this.m_killFieldTransform);

    // Move the pumps
    for (let i = 0; i < this.m_pumpIndex; i++) {
      const pump = this.m_pumps[i];

      // Pumps can and will clog up if the pile of particles they're
      // trying to push is too heavy. Increase k_pumpForce to make
      // stronger pumps.
      pump.ApplyForceToCenter(this.m_pumpForce, true);

      this.m_pumpTimer += dt;

      // Reset pump to go back right again
      if (this.m_pumpTimer > SandboxParams.k_flipTime) {
        this.m_pumpTimer -= SandboxParams.k_flipTime;
        this.m_pumpForce.x *= -1;
      }
    }

    testbed.g_debugDraw.DrawString(
      5, this.m_textLine, "Keys: (a) zero out (water), (q) powder");
    this.m_textLine += testbed.DRAW_STRING_NEW_LINE;
    testbed.g_debugDraw.DrawString(
      5, this.m_textLine, "      (t) tensile, (v) viscous");
    this.m_textLine += testbed.DRAW_STRING_NEW_LINE;
  }

  GetDefaultViewZoom(): number {
    return super.GetDefaultViewZoom();
  }

  static Create() {
    return new Sandbox();
  }
}

// #endif