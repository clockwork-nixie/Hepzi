namespace Hepzi {
    export class ApplicationContext {
        private readonly _avatars: AvatarLookup = {};


        constructor(factory: IFactory, protagonist: Avatar) {
            this._avatars[protagonist.userId] = protagonist;
            this.protagonist = protagonist;
            this.target = null;
        }


        public readonly protagonist: Avatar;
        public target: Mobile | null;


        public addAvatar(avatar: Avatar): void {
            this._avatars[avatar.userId] = avatar;
        }


        public getAvatar(userId: number): Avatar | null {
            return this._avatars[userId] ?? null;
        }


        public getAvatars(): Avatar[] {
            return Object.keys(this._avatars).map(userId => this._avatars[parseInt(userId)]);
        }


        public getUserIdByAvatarName(name: string): (number | null) {
            name = name.toLowerCase();

            return parseInt(Object.keys(this._avatars).filter(userId => this._avatars[parseInt(userId)]?.name.toLowerCase() == name)[0]) || null;
        }


        public removeAvatar(userId: number): void {
            delete this._avatars[userId];
        }
    }
}