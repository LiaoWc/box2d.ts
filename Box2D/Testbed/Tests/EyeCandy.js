// #if B2_ENABLE_PARTICLE
System.register(["../../Box2D/Box2D", "../Testbed"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var box2d, testbed, EyeCandy;
    return {
        setters: [
            function (box2d_1) {
                box2d = box2d_1;
            },
            function (testbed_1) {
                testbed = testbed_1;
            }
        ],
        execute: function () {
            EyeCandy = class EyeCandy extends testbed.Test {
                constructor() {
                    super();
                    this.m_particleSystem.SetDamping(0.2);
                    this.m_particleSystem.SetRadius(0.3 * 2);
                    this.m_particleSystem.SetGravityScale(0.4);
                    this.m_particleSystem.SetDensity(1.2);
                    var bdg = new box2d.b2BodyDef();
                    var ground = this.m_world.CreateBody(bdg);
                    var bd = new box2d.b2BodyDef();
                    bd.type = box2d.b2BodyType.b2_staticBody; //box2d.b2BodyType.b2_dynamicBody;
                    bd.allowSleep = false;
                    bd.position.Set(0.0, 0.0);
                    var body = this.m_world.CreateBody(bd);
                    var shape = new box2d.b2PolygonShape();
                    shape.SetAsBox(0.5, 10.0, new box2d.b2Vec2(20.0, 0.0), 0.0);
                    body.CreateFixture(shape, 5.0);
                    shape.SetAsBox(0.5, 10.0, new box2d.b2Vec2(-20.0, 0.0), 0.0);
                    body.CreateFixture(shape, 5.0);
                    shape.SetAsBox(0.5, 20.0, new box2d.b2Vec2(0.0, 10.0), Math.PI / 2.0);
                    body.CreateFixture(shape, 5.0);
                    shape.SetAsBox(0.5, 20.0, new box2d.b2Vec2(0.0, -10.0), Math.PI / 2.0);
                    body.CreateFixture(shape, 5.0);
                    bd.type = box2d.b2BodyType.b2_dynamicBody;
                    bd.position.Set(0.0, 0.0);
                    this.m_mover = this.m_world.CreateBody(bd);
                    shape.SetAsBox(1.0, 5.0, new box2d.b2Vec2(0.0, 2.0), 0.0);
                    this.m_mover.CreateFixture(shape, 5.0);
                    var jd = new box2d.b2RevoluteJointDef();
                    jd.bodyA = ground;
                    jd.bodyB = this.m_mover;
                    jd.localAnchorA.Set(0.0, 0.0);
                    jd.localAnchorB.Set(0.0, 5.0);
                    jd.referenceAngle = 0.0;
                    jd.motorSpeed = 0;
                    jd.maxMotorTorque = 1e7;
                    jd.enableMotor = true;
                    this.m_joint = this.m_world.CreateJoint(jd);
                    var pd = new box2d.b2ParticleGroupDef();
                    pd.flags = box2d.b2ParticleFlag.b2_waterParticle;
                    var shape2 = new box2d.b2PolygonShape();
                    shape2.SetAsBox(9.0, 9.0, new box2d.b2Vec2(0.0, 0.0), 0.0);
                    pd.shape = shape2;
                    this.m_particleSystem.CreateParticleGroup(pd);
                }
                Step(settings) {
                    var time = new Date().getTime();
                    this.m_joint.SetMotorSpeed(0.7 * Math.cos(time / 1000));
                    super.Step(settings);
                }
                static Create() {
                    return new EyeCandy();
                }
            };
            exports_1("EyeCandy", EyeCandy);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXllQ2FuZHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJFeWVDYW5keS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5QkFBeUI7Ozs7Ozs7Ozs7Ozs7OztZQUt6QixXQUFBLGNBQXNCLFNBQVEsT0FBTyxDQUFDLElBQUk7Z0JBSXhDO29CQUNFLEtBQUssRUFBRSxDQUFDO29CQUVSLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN6QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMzQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUV0QyxJQUFJLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBRTFDLElBQUksRUFBRSxHQUFHLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUMvQixFQUFFLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsa0NBQWtDO29CQUM1RSxFQUFFLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztvQkFDdEIsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMxQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFFdkMsSUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3ZDLEtBQUssQ0FBQyxRQUFRLENBQUMs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