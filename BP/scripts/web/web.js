import { calculateDistance, traceLine, normalizeVector, createShockwave, spawnTrail, playSound } from '../utils.js';

const Point = class {
	constructor(x, y, z, locked = false) {
		this.current = {
			x: x,
			y: y,
			z: z
		};
		this.previous = {
			x: x,
			y: y,
			z: z
		};
		this.locked = locked;
	}

	set(location) {
		this.current = location;
		this.previous = location;
	}
};

const Connection = class {
	constructor(p1, p2, length) {
		this.p1 = p1;
		this.p2 = p2;
		this.length = length;
	}
};

export const Web = class {
	constructor(player, start, end, numberOfPoints, controllability = 0.1) {
        this.owner = player;
		this.start = start;
		this.end = end;

		this.numberOfPoints = numberOfPoints;
		this.controllability = controllability;

		this.iterations = 7;
		this.gravity = -0.7;

		this.points = [];
		this.connections = [];

        this.lastPoint = undefined;
        this.swingEntity = undefined;

        this.dissolved = false;
		this.timeSinceLastSwingAudio = 0;
		this.dismounted = false;

		this.create();
	}

	createConnection(p1, p2, length) {
		const connection = new Connection(p1, p2, length);
		this.connections.push(connection);
		return connection;
	}

	create() {
		for (let i = 0; i < this.numberOfPoints; i++) {
			const x = this.start.x + (this.end.x - this.start.x) * (i / this.numberOfPoints);
			const y = this.start.y + (this.end.y - this.start.y) * (i / this.numberOfPoints);
			const z = this.start.z + (this.end.z - this.start.z) * (i / this.numberOfPoints);
			this.points.push(new Point(x, y, z));
			
			if (i > 0) {
				const p1 = this.points[i - 1];
				const p2 = this.points[i];
				this.createConnection(p1, p2, calculateDistance(p1.current, p2.current));
			}
		}

		this.points[0].locked = true;
        this.lastPoint = this.points[this.points.length - 1];

        this.swingEntity = this.owner.dimension.spawnEntity('g:swing', this.lastPoint.current);
        this.swingEntity.runCommand(`ride "${this.owner.name}" start_riding @s teleport_rider`);
		this.swingEntity.addTag(`${this.owner.id}`);

		playSound(this.owner, "spiderman.swing", 1, this.owner.location, 5);
		this.timeSinceLastSwingAudio = 0;
	}

	tick(PLAYER_DATA) {
        let endRuntime = false;
		for (const point of this.points) {
			if (!point.locked) {
				const prevX = point.current.x;
				const prevY = point.current.y;
				const prevZ = point.current.z;
		
				point.current.y += this.gravity * 0.1;

				// We need a way to cap the speed of the web
				// This is a simple way to do it
				const speed = Math.hypot(point.current.x - point.previous.x, point.current.y - point.previous.y, point.current.z - point.previous.z);
				if (speed > 3.5) {
					point.current.x = point.previous.x + (point.current.x - point.previous.x) / speed * 3.5;
					point.current.y = point.previous.y + (point.current.y - point.previous.y) / speed * 3.5;
					point.current.z = point.previous.z + (point.current.z - point.previous.z) / speed * 3.5;
				}

                point.current.x += point.current.x - point.previous.x;
                point.current.y += point.current.y - point.previous.y;
                point.current.z += point.current.z - point.previous.z;
		
				point.previous.x = prevX;
				point.previous.y = prevY;
				point.previous.z = prevZ;
			}
		}

		this.timeSinceLastSwingAudio++;
		if (this.timeSinceLastSwingAudio > 45) {
			playSound(this.owner, "spiderman.swing", 1, this.owner.location, 5);
			this.timeSinceLastSwingAudio = 0;
		}

		const viewDir = this.owner.getViewDirection();
		this.owner.playAnimation("animation.spiderman.swing");

		// AIM ASSIST #1
		// This is so the player doesn't get swung into walls to the direct left and right of the swing direction
		// IE: keep the player swinging to the center in a straight line
		const left = { x: viewDir.z, y: 0, z: -viewDir.x };
		const right = { x: -viewDir.z, y: 0, z: viewDir.x };		

		const headLoc = this.owner.getHeadLocation();

		const leftRaycast = this.owner.dimension.getBlockFromRay(headLoc, left, { maxDistance: 10, includeLiquidBlocks: true, includePassableBlocks: true });
		const rightRaycast = this.owner.dimension.getBlockFromRay(headLoc, right, { maxDistance: 10, includeLiquidBlocks: true, includePassableBlocks: true });
		
		if (rightRaycast) {
			const blockPos = rightRaycast.block.location;
			const distance = calculateDistance(headLoc, blockPos);

			const factor = 1/distance;
			if (distance < 1.5) {
				this.lastPoint.current.x += left.x * 2 * factor;
				this.lastPoint.current.z += left.z * 2 * factor;
			}
	
			this.lastPoint.current.x += left.x * 3.5 * factor;
			this.lastPoint.current.z += left.z * 3.5 * factor;
		}

		if (leftRaycast) {
			const blockPos = leftRaycast.block.location;
			const distance = calculateDistance(headLoc, blockPos);

			const factor = 1/distance;
			if (distance < 1.5) {
				this.lastPoint.current.x += right.x * 2 * factor;
				this.lastPoint.current.z += right.z * 2 * factor;
			}

			this.lastPoint.current.x += right.x * 3.5 * factor;
			this.lastPoint.current.z += right.z * 3.5 * factor;
		}

		// AIM ASSIST #2
		const forwardRaycast = this.owner.dimension.getBlockFromRay(this.owner.location, viewDir, { maxDistance: 5, includeLiquidBlocks: true, includePassableBlocks: true });
		const backwardRaycast = this.owner.dimension.getBlockFromRay(this.owner.location, { x: -viewDir.x, y: -viewDir.y, z: -viewDir.z }, { maxDistance: 5, includeLiquidBlocks: true, includePassableBlocks: true });
		const downRaycast = this.owner.dimension.getBlockFromRay(this.owner.location, { x: 0, y: -1, z: 0 }, { maxDistance: 5, includeLiquidBlocks: true, includePassableBlocks: true });

		if (forwardRaycast) {
			const blockPos = forwardRaycast.block.location;
			const distance = calculateDistance(this.owner.location, blockPos);

			const distanceFactor = Math.max(Math.min(1/distance, 0.1), 0.3);

			this.lastPoint.current.x += -viewDir.x * distanceFactor;
			this.lastPoint.current.y += -viewDir.y * distanceFactor;
			this.lastPoint.current.z += -viewDir.z * distanceFactor;

			if (distance < 0.5) endRuntime = true;
		}
		
		if (backwardRaycast) {
			const blockPos = backwardRaycast.block.location;
			const distance = calculateDistance(this.owner.location, blockPos);

			const distanceFactor = Math.max(Math.min(1/distance, 0.1), 0.3);

			this.lastPoint.current.x += viewDir.x * distanceFactor;
			this.lastPoint.current.y += viewDir.y * distanceFactor;
			this.lastPoint.current.z += viewDir.z * distanceFactor

			if (distance < 0.5) endRuntime = true;
		}

		if (downRaycast) {
			for (const connection of this.connections) {
				connection.length = calculateDistance(connection.p1.current, connection.p2.current) * 0.8;
			}
		}

        const block = this.owner.dimension.getBlock(this.owner.location);
        if (block && block.isSolid) {
			endRuntime = true;
		}
		
		for (let i = 0; i < this.iterations; i++) {
			this.connections.reverse();
			this.points.reverse();

			for (const connection of this.connections) {
				const centerX = (connection.p1.current.x + connection.p2.current.x) / 2;
				const centerY = (connection.p1.current.y + connection.p2.current.y) / 2;
				const centerZ = (connection.p1.current.z + connection.p2.current.z) / 2;
		
				const dir = normalizeVector({
					x: connection.p1.current.x - connection.p2.current.x,
					y: connection.p1.current.y - connection.p2.current.y,
					z: connection.p1.current.z - connection.p2.current.z
				}, 1);
		
				if (!connection.p1.locked) {
					connection.p1.current.x = centerX + dir.x * connection.length / 2;
					connection.p1.current.y = centerY + dir.y * connection.length / 2;
					connection.p1.current.z = centerZ + dir.z * connection.length / 2;
				}
		
				if (!connection.p2.locked) {
					connection.p2.current.x = centerX - dir.x * connection.length / 2;
					connection.p2.current.y = centerY - dir.y * connection.length / 2;
					connection.p2.current.z = centerZ - dir.z * connection.length / 2;
				}
			}
		}

		PLAYER_DATA.state = "swinging";
        if (PLAYER_DATA.cooldown > 0 && this.swingEntity) this.swingEntity.runCommand(`ride "${this.owner.name}" start_riding @s teleport_rider`);
        
		if (PLAYER_DATA.webModifier) traceLine(this.owner, this.owner.location, this.owner.location, 1, `a:${PLAYER_DATA.webModifier}_web`);

        if (!this.owner.getComponent('minecraft:riding') && this.swingEntity) {
            endRuntime = true;
        }

        if (endRuntime && this.swingEntity) {
            this.swingEntity.triggerEvent('minecraft:despawn');
            this.swingEntity = undefined; 
			PLAYER_DATA.cooldown = 1;
        }

		const nearbyEntities = this.owner.dimension.getEntities({ location: this.lastPoint.current, maxDistance: 3, excludeNames: [this.owner.name], excludeFamilies: ["inanimate"], excludeTypes: ["item"], excludeTags: ["spider_dmg_off", `${this.owner.id}`]});
		if (nearbyEntities.length > 0 && PLAYER_DATA.webFluidAmount >= 15) {
			PLAYER_DATA.webFluidAmount -= 15;

			const viewDir = this.owner.getViewDirection();
			for (const entity of nearbyEntities) {
				try {
					entity.applyKnockback(viewDir.x, viewDir.z, 5, 0.8);
					entity.applyDamage(8, { cause: "entityAttack", damagingEntity: this.owner });
					this.owner.runCommandAsync("camerashake add @a[r=8] 0.2 0.1 positional");
					spawnTrail(entity, 5);
				} catch (err) {};
			}
		}

        if (!this.swingEntity) {
            if (!this.dismounted) {
				this.dismounted = true;
				
                const { current, previous } = this.lastPoint;
                const velocity = { x: current.x - previous.x, y: current.y - previous.y, z: current.z - previous.z };

				const viewDir = this.owner.getViewDirection();
                
                const magnitude = Math.abs(Math.hypot(velocity.x, velocity.y, velocity.z));

                this.owner.applyKnockback(viewDir.x, viewDir.z, magnitude*3 + 1, 1 + magnitude * 0.4);
				//if (this.controllability > 0.2) this.owner.applyKnockback(viewDir.x, viewDir.z, magnitude*2 + 1, 1 + magnitude * 0.2);

				this.owner.addEffect("slow_falling", 5, { amplifier: 1, showParticles: false });
				
				playSound(this.owner, "spiderman.release", 1, this.owner.location, 5);
				playSound(this.owner, "spiderman.woosh", 2, this.owner.location, 5);

				this.owner.runCommand(`stopsound @s spiderman.swing`);

				PLAYER_DATA.state = "released";

				PLAYER_DATA.trickTimer = 8;
            }

			this.owner.runCommand(`stopsound @s spiderman.swing`);

            this.dissolve();
        } else {
            this.lastPoint.current.x += viewDir.x * this.controllability;
            this.lastPoint.current.y += viewDir.y * this.controllability;
            this.lastPoint.current.z += viewDir.z * this.controllability;

            this.swingEntity.teleport(this.lastPoint.current);
        }
	}

    dissolve() {
        if (this.points.length === 0) return this.dissolved = true;
        const index = Math.floor(Math.random() * this.points.length);
        this.points.splice(index, 1);
    }

	display() {
		try {
			for (let i = 0; i < this.points.length - 1; i++) {
				const p1 = this.points[i];
				const p2 = this.points[i + 1];

				const distance = this.connections[i].length;
				const points = Math.min(Math.max(10, Math.floor(distance * 10)), 15);
	
				traceLine(this.owner, p1.previous, p2.previous, points, 'a:web');
			}
		} catch (err) {
			this.swingEntity.triggerEvent('minecraft:despawn');
            this.swingEntity = undefined; 
			this.dissolve();
		}
	}
}