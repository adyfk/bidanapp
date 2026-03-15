package config

import (
	"net"
	"strconv"
	"time"
)

type Config struct {
	App           AppConfig
	HTTP          HTTPConfig
	CORS          CORSConfig
	Simulation    SimulationConfig
	Database      DatabaseConfig
	Redis         RedisConfig
	Observability ObservabilityConfig
}

type AppConfig struct {
	Name        string
	Version     string
	Environment string
}

type HTTPConfig struct {
	Host              string
	Port              int
	ReadHeaderTimeout time.Duration
	ReadTimeout       time.Duration
	WriteTimeout      time.Duration
	IdleTimeout       time.Duration
	ShutdownTimeout   time.Duration
	MaxHeaderBytes    int
}

func (c HTTPConfig) Address() string {
	return net.JoinHostPort(c.Host, strconv.Itoa(c.Port))
}

type CORSConfig struct {
	AllowedOrigins []string
}

func (c CORSConfig) PrimaryOrigin() string {
	if len(c.AllowedOrigins) == 0 {
		return ""
	}

	return c.AllowedOrigins[0]
}

type SimulationConfig struct {
	DataDir string
}

type DatabaseConfig struct {
	URL string
}

type RedisConfig struct {
	URL string
}

type ObservabilityConfig struct {
	LogLevel  string
	LogFormat string
}
