BEGIN;

CREATE TABLE IF NOT EXISTS public.games_history
(
    id serial NOT NULL,
    user_id integer,
    score integer,
    end_lives integer,
    begin_lives integer,
    nbgames integer,
    played_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_date bigint,
    CONSTRAINT games_history_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.logs
(
    id serial NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    title character varying(255) COLLATE pg_catalog."default" NOT NULL,
    description character varying(255) COLLATE pg_catalog."default",
    public boolean NOT NULL DEFAULT true,
    user_id integer,
    link character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.relation
(
    id serial NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    user_id integer NOT NULL,
    user2_id integer NOT NULL,
    state integer NOT NULL DEFAULT 0,
    CONSTRAINT relation_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.users
(
    username text COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    patch integer NOT NULL DEFAULT 0,
    id serial NOT NULL,
    role bigint NOT NULL DEFAULT 1,
    bio text COLLATE pg_catalog."default",
    pins integer[],
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username)
);

ALTER TABLE IF EXISTS public.games_history
    ADD CONSTRAINT games_history_relation_1 FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.logs
    ADD CONSTRAINT logs_relation_1 FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

END;