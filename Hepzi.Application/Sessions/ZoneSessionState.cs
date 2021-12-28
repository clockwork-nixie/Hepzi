﻿using Hepzi.Utilities.Models;

namespace Hepzi.Application.Sessions
{
    public class ZoneSessionState
    {
        public Vector3d Direction { get; } = new Vector3d(1, 0, 0);
        public Vector3d Position { get; } = new Vector3d(0, 0, 0);
    }
}
